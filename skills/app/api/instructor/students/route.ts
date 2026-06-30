import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { courses, enrollments } from "../../../../db/schema"
import { eq, sql } from "drizzle-orm"
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

    // Get instructor's courses
    const instructorCourses = await db.query.courses.findMany({
      where: eq(courses.instructorId, payload.userId),
      columns: { id: true },
    })

    const courseIds = instructorCourses.map((c) => c.id)

    if (courseIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Get all enrollments for these courses
    const students = await db.query.enrollments.findMany({
      where: sql`${enrollments.courseId} IN (${sql.join(courseIds)})`,
      with: {
        student: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            phone: true,
            city: true,
          },
        },
        course: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: (enrollments, { desc }) => [desc(enrollments.enrolledAt)],
    })

    return NextResponse.json({
      success: true,
      data: students,
    })
  } catch (error) {
    console.error("Get instructor students error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch students" } },
      { status: 500 }
    )
  }
}