import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { courses, users } from "../../../../db/schema"  // users add kiya
import { eq } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"

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

    const allCourses = await db.query.courses.findMany({
      with: {
        instructor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        category: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: (courses, { desc }) => [desc(courses.createdAt)],
    })

    return NextResponse.json({
      success: true,
      data: allCourses,
    })
  } catch (error) {
    console.error("Get admin courses error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch courses" } },
      { status: 500 }
    )
  }
}