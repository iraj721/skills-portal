import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { categories, courses } from "../../../../db/schema"
import { eq, sql } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    
    if (payload.role !== "instructor" && payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_002", message: "Unauthorized" } },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if category has courses
    const courseCount = await db.select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(eq(courses.categoryId, id))

    if (courseCount[0].count > 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Cannot delete category with existing courses" } },
        { status: 400 }
      )
    }

    await db.delete(categories).where(eq(categories.id, id))

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error) {
    console.error("Delete category error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete category" } },
      { status: 500 }
    )
  }
}