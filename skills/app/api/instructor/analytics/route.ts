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
    })

    const courseIds = instructorCourses.map((c) => c.id)

    if (courseIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalStudents: 0,
          totalCourses: 0,
          totalCertificates: 0,
          avgCompletion: 0,
          courses: [],
          monthlyEnrollments: [],
        },
      })
    }

    // Get total students
    const totalStudentsResult = await db.select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(sql`${enrollments.courseId} IN (${sql.join(courseIds)})`)

    // Get total certificates
    const totalCertificatesResult = await db.select({ count: sql<number>`count(*)` })
      .from(certificates)
      .where(sql`${certificates.courseId} IN (${sql.join(courseIds)})`)

    // Get average completion
    const avgCompletionResult = await db.select({ avg: sql<number>`COALESCE(AVG(${enrollments.progressPercent}), 0)` })
      .from(enrollments)
      .where(sql`${enrollments.courseId} IN (${sql.join(courseIds)})`)

    // Get per-course stats
    const courseStats = await Promise.all(
      instructorCourses.map(async (course) => {
        const students = await db.select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id))

        const avgProgress = await db.select({ avg: sql<number>`COALESCE(AVG(${enrollments.progressPercent}), 0)` })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id))

        const completed = await db.select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(and(
            eq(enrollments.courseId, course.id),
            eq(enrollments.status, "completed")
          ))

        return {
          id: course.id,
          title: course.title,
          totalStudents: Number(students[0]?.count || 0),
          avgProgress: Math.round(Number(avgProgress[0]?.avg || 0)),
          completedCount: Number(completed[0]?.count || 0),
        }
      })
    )

    // Get monthly enrollments (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyEnrollments = await db.select({
      month: sql<string>`TO_CHAR(${enrollments.enrolledAt}, 'Mon YYYY')`,
      count: sql<number>`count(*)`,
    })
    .from(enrollments)
    .where(and(
      sql`${enrollments.courseId} IN (${sql.join(courseIds)})`,
      sql`${enrollments.enrolledAt} >= ${sixMonthsAgo}`
    ))
    .groupBy(sql`TO_CHAR(${enrollments.enrolledAt}, 'Mon YYYY')`)
    .orderBy(sql`MIN(${enrollments.enrolledAt})`)

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: Number(totalStudentsResult[0]?.count || 0),
        totalCourses: instructorCourses.length,
        totalCertificates: Number(totalCertificatesResult[0]?.count || 0),
        avgCompletion: Math.round(Number(avgCompletionResult[0]?.avg || 0)),
        courses: courseStats,
        monthlyEnrollments: monthlyEnrollments.map((m) => ({
          month: m.month,
          count: Number(m.count),
        })),
      },
    })
  } catch (error) {
    console.error("Get analytics error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch analytics" } },
      { status: 500 }
    )
  }
}