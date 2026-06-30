import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { enrollments, courses, progress, certificates, assignments, submissions, quizzes, quizAttempts, lessons, modules } from "../../../../db/schema"
import { eq, and, sql, count } from "drizzle-orm"
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

    // Get active enrollments
    const activeEnrollments = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.studentId, payload.userId),
        eq(enrollments.status, "active")
      ),
      with: {
        course: {
          with: {
            instructor: {
              columns: { id: true, fullName: true },
            },
            category: {
              columns: { id: true, name: true },
            },
          },
        },
        batch: true,
      },
      orderBy: (enrollments, { desc }) => [desc(enrollments.enrolledAt)],
    })

    const courseIds = activeEnrollments.map(e => e.courseId)

    // FIX: Simplified completed lessons count - just count progress records for this student
    let completedLessonsCount = 0
    if (courseIds.length > 0) {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(progress)
        .where(and(
          eq(progress.studentId, payload.userId),
          eq(progress.isCompleted, true)
        ))
      completedLessonsCount = Number(result[0]?.count || 0)
    }

    // Get certificates count
    const certificatesCount = await db.select({ count: count() })
      .from(certificates)
      .where(eq(certificates.studentId, payload.userId))

    // Get pending assignments
    const pendingAssignments = courseIds.length > 0
      ? await db.query.assignments.findMany({
          where: sql`${assignments.courseId} IN (${sql.join(courseIds)})`,
          with: {
            course: { columns: { id: true, title: true } },
            module: { columns: { id: true, title: true } },
          },
          orderBy: (assignments, { asc }) => [asc(assignments.dueDate)],
          limit: 5,
        })
      : []

    // Get submissions to filter pending
    const userSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.studentId, payload.userId),
    })

    const submittedAssignmentIds = new Set(userSubmissions.map(s => s.assignmentId))
    const pendingAssignmentsFiltered = pendingAssignments.filter(
      a => !submittedAssignmentIds.has(a.id)
    )

    // Get upcoming quizzes
    const upcomingQuizzes = courseIds.length > 0
      ? await db.query.quizzes.findMany({
          where: and(
            sql`${quizzes.courseId} IN (${sql.join(courseIds)})`,
            eq(quizzes.isActive, true)
          ),
          with: {
            course: { columns: { id: true, title: true } },
          },
          orderBy: (quizzes, { asc }) => [asc(quizzes.weekNumber)],
          limit: 5,
        })
      : []

    // Get recent quiz attempts
    const recentAttempts = await db.query.quizAttempts.findMany({
      where: eq(quizAttempts.studentId, payload.userId),
      with: {
        quiz: { columns: { id: true, title: true, weekNumber: true } },
      },
      orderBy: (quizAttempts, { desc }) => [desc(quizAttempts.completedAt)],
      limit: 5,
    })

    // Calculate overall stats
    const totalEnrolled = activeEnrollments.length
    const completedCourses = activeEnrollments.filter(e => e.status === "completed").length
    const avgProgress = totalEnrolled > 0
      ? Math.round(activeEnrollments.reduce((sum, e) => sum + (e.progressPercent || 0), 0) / totalEnrolled)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalEnrolled,
          completedCourses,
          inProgress: totalEnrolled - completedCourses,
          avgProgress,
          totalCertificates: Number(certificatesCount[0]?.count || 0),
          completedLessons: completedLessonsCount,
        },
        activeEnrollments: activeEnrollments.map(e => ({
          id: e.id,
          courseId: e.courseId,
          courseTitle: e.course?.title,
          courseThumbnail: e.course?.thumbnailUrl,
          instructorName: e.course?.instructor?.fullName,
          categoryName: e.course?.category?.name,
          progressPercent: e.progressPercent,
          status: e.status,
          enrolledAt: e.enrolledAt,
          batchName: e.batch?.name,
        })),
        pendingAssignments: pendingAssignmentsFiltered.map(a => ({
          id: a.id,
          title: a.title,
          courseTitle: a.course?.title,
          moduleTitle: a.module?.title,
          dueDate: a.dueDate,
          totalMarks: a.totalMarks,
        })),
        upcomingQuizzes: upcomingQuizzes.map(q => ({
          id: q.id,
          title: q.title,
          courseTitle: q.course?.title,
          weekNumber: q.weekNumber,
          timeLimitMinutes: q.timeLimitMinutes,
        })),
        recentAttempts: recentAttempts.map(a => ({
          id: a.id,
          quizTitle: a.quiz?.title,
          weekNumber: a.quiz?.weekNumber,
          score: a.score,
          totalMarks: a.totalMarks,
          percentage: a.percentage,
          isPassed: a.isPassed,
          completedAt: a.completedAt,
        })),
      },
    })
  } catch (error) {
    console.error("Student dashboard error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch dashboard data" } },
      { status: 500 }
    )
  }
}