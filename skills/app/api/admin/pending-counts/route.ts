import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { courses, instructorProfiles, users } from "../../../../db/schema"  // users add kiya
import { eq, sql } from "drizzle-orm"  // FIXED: sql add kiya
import { verifyToken } from "../../../../lib/auth"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)

    // Verify admin
    const admin = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),  // FIXED: db.$schema.users.id → users.id
    })

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    const pendingCourses = await db.select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(eq(courses.status, "pending"))

    const pendingInstructors = await db.select({ count: sql<number>`count(*)` })
      .from(instructorProfiles)
      .where(eq(instructorProfiles.isVerified, false))

    return NextResponse.json({
      success: true,
      data: {
        courses: Number(pendingCourses[0]?.count || 0),
        instructors: Number(pendingInstructors[0]?.count || 0),
      },
    })
  } catch (error) {
    console.error("Pending counts error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch pending counts" } },
      { status: 500 }
    )
  }
}