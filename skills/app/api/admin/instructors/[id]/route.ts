import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../db"
import { instructorProfiles, users, courses } from "../../../../../db/schema"
import { eq } from "drizzle-orm"
import { verifyToken } from "../../../../../lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    const admin = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    const { id } = await params

    const profile = await db.query.instructorProfiles.findFirst({
      where: eq(instructorProfiles.id, id),
    })

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Instructor not found" } },
        { status: 404 }
      )
    }

    // FIX: Check if instructor has courses before deleting
    const instructorCourses = await db.query.courses.findMany({
      where: eq(courses.instructorId, profile.userId),
    })

    if (instructorCourses.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "CONFLICT", 
            message: `Instructor has ${instructorCourses.length} course(s). Reassign or delete courses first.` 
          } 
        },
        { status: 409 }
      )
    }

    await db.delete(instructorProfiles).where(eq(instructorProfiles.id, id))
    await db.delete(users).where(eq(users.id, profile.userId))

    return NextResponse.json({
      success: true,
      message: "Instructor deleted successfully",
    })
  } catch (error) {
    console.error("Delete instructor error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete instructor" } },
      { status: 500 }
    )
  }
}