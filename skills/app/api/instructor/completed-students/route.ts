import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { courses, enrollments, certificates } from "../../../../db/schema"
import { eq, and, sql } from "drizzle-orm"
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

    // Get completed enrollments
    const completedEnrollments = await db.query.enrollments.findMany({
      where: and(
        sql`${enrollments.courseId} IN (${sql.join(courseIds)})`,
        eq(enrollments.status, "completed")
      ),
      with: {
        student: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          columns: {
            id: true,
            title: true,
          },
        },
        certificates: true,
      },
      orderBy: (enrollments, { desc }) => [desc(enrollments.completedAt)],
    })

    // Add certificate info to each enrollment
    const enrollmentsWithCerts = completedEnrollments.map((e) => ({
      ...e,
      certificate: e.certificates?.[0] || null,
    }))

    return NextResponse.json({
      success: true,
      data: enrollmentsWithCerts,
    })
  } catch (error) {
    console.error("Get completed students error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch completed students" } },
      { status: 500 }
    )
  }
}