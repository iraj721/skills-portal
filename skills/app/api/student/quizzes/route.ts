import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { quizzes, quizQuestions, enrollments, quizAttempts, weeklyUnlocks } from "../../../../db/schema"
import { eq, and, inArray } from "drizzle-orm"
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

    // Get student's active enrollments
    const studentEnrollments = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.studentId, payload.userId),
        eq(enrollments.status, "active")
      ),
      with: {
        course: {
          columns: { id: true, title: true, slug: true },
        },
      },
    })

    const courseIds = studentEnrollments.map(e => e.courseId)
    
    if (courseIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get all quizzes for enrolled courses
    const allQuizzes = await db.query.quizzes.findMany({
      where: inArray(quizzes.courseId, courseIds),
      with: {
        course: {
          columns: { id: true, title: true },
        },
        questions: {
          columns: { id: true },
        },
      },
      orderBy: [quizzes.weekNumber],
    })

    // Get student's attempts
    const attempts = await db.query.quizAttempts.findMany({
      where: eq(quizAttempts.studentId, payload.userId),
    })

    // Get weekly unlocks
    const enrollmentIds = studentEnrollments.map(e => e.id)
    const unlocks = await db.query.weeklyUnlocks.findMany({
      where: inArray(weeklyUnlocks.enrollmentId, enrollmentIds),
    })

    // Enrich quizzes with status
    const enrichedQuizzes = allQuizzes.map(quiz => {
      const enrollment = studentEnrollments.find(e => e.courseId === quiz.courseId)
      const attempt = attempts.find(a => a.quizId === quiz.id)
      const weekUnlock = unlocks.find(u => 
        u.enrollmentId === enrollment?.id && u.weekNumber === quiz.weekNumber
      )

      const isUnlocked = !!weekUnlock
      const hasAttempted = !!attempt

      return {
        ...quiz,
        isAvailable: isUnlocked && !hasAttempted,
        isLocked: !isUnlocked,
        hasAttempted,
        attempt: attempt || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedQuizzes,
    })
  } catch (error) {
    console.error("Get student quizzes error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch quizzes" } },
      { status: 500 }
    )
  }
}