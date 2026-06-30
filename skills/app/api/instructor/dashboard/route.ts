import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { courses, enrollments, assignments } from "../../../../db/schema"
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

    // Get total students
    const totalStudentsResult = courseIds.length > 0 
      ? await db.select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(sql`${enrollments.courseId} IN (${sql.join(courseIds)})`)
      : [{ count: 0 }]

    // Get total assignments
    const totalAssignmentsResult = courseIds.length > 0
      ? await db.select({ count: sql<number>`count(*)` })
          .from(assignments)
          .where(sql`${assignments.courseId} IN (${sql.join(courseIds)})`)
      : [{ count: 0 }]

    // Get average completion
    const avgCompletionResult = courseIds.length > 0
      ? await db.select({ avg: sql<number>`COALESCE(AVG(${enrollments.progressPercent}), 0)` })
          .from(enrollments)
          .where(sql`${enrollments.courseId} IN (${sql.join(courseIds)})`)
      : [{ avg: 0 }]

    // Get recent courses with student count
    const recentCourses = await db.select({
      id: courses.id,
      title: courses.title,
      thumbnailUrl: courses.thumbnailUrl,
      status: courses.status,
      totalStudents: sql<number>`COALESCE((SELECT count(*) FROM ${enrollments} WHERE ${enrollments.courseId} = ${courses.id}), 0)`,
    })
    .from(courses)
    .where(eq(courses.instructorId, payload.userId))
    .orderBy(sql`${courses.createdAt} DESC`)
    .limit(5)

    // Get recent students
    const recentStudents = courseIds.length > 0
      ? await db.query.enrollments.findMany({
          where: sql`${enrollments.courseId} IN (${sql.join(courseIds)})`,
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
          },
          orderBy: (enrollments, { desc }) => [desc(enrollments.enrolledAt)],
          limit: 5,
        })
      : []

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalCourses: instructorCourses.length,
          totalStudents: Number(totalStudentsResult[0]?.count || 0),
          totalAssignments: Number(totalAssignmentsResult[0]?.count || 0),
          avgCompletion: Math.round(Number(avgCompletionResult[0]?.avg || 0)),
        },
        recentCourses,
        recentStudents,
      },
    })
  } catch (error) {
    console.error("Instructor dashboard error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch dashboard data" } },
      { status: 500 }
    )
  }
}