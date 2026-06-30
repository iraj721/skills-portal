import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { quizAttempts, quizzes, quizQuestions, enrollments, weeklyUnlocks, attendance } from "../../../../db/schema"
import { eq, and } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { z } from "zod"

const attemptSchema = z.object({
  quizId: z.string().uuid("Invalid quiz ID"),
  answers: z.record(z.array(z.number())),
  timeTakenSeconds: z.number().min(0).optional(),
})

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
    const { searchParams } = request.nextUrl
    const quizId = searchParams.get("quizId")

    if (!quizId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Quiz ID required" } },
        { status: 400 }
      )
    }

    const quiz = await db.query.quizzes.findFirst({
      where: and(eq(quizzes.id, quizId), eq(quizzes.isActive, true)),
      with: {
        course: { columns: { id: true } },
        questions: {
          orderBy: (quizQuestions, { asc }) => [asc(quizQuestions.sortOrder)],
          columns: {
            id: true,
            question: true,
            questionType: true,
            options: true,
            marks: true,
            sortOrder: true,
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Quiz not found or inactive" } },
        { status: 404 }
      )
    }

    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.studentId, payload.userId),
        eq(enrollments.courseId, quiz.courseId),
        eq(enrollments.status, "active")
      ),
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not enrolled in this course" } },
        { status: 403 }
      )
    }

    const weekUnlock = await db.query.weeklyUnlocks.findFirst({
      where: and(
        eq(weeklyUnlocks.enrollmentId, enrollment.id),
        eq(weeklyUnlocks.weekNumber, quiz.weekNumber ?? 0)
      ),
    })

    if (!weekUnlock) {
      return NextResponse.json(
        { success: false, error: { code: "LOCKED", message: `Week ${quiz.weekNumber} is not yet unlocked` } },
        { status: 403 }
      )
    }

    const existingAttempt = await db.query.quizAttempts.findFirst({
      where: and(
        eq(quizAttempts.quizId, quizId),
        eq(quizAttempts.studentId, payload.userId)
      ),
    })

    if (existingAttempt) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_ATTEMPTED", message: "You have already attempted this quiz", data: existingAttempt } },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        quiz: {
          ...quiz,
          questions: quiz.questions,
        },
        timeLimitMinutes: quiz.timeLimitMinutes,
      },
    })
  } catch (error) {
    console.error("Get quiz for attempt error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch quiz" } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    const body = await request.json()
    const { quizId, answers, timeTakenSeconds } = attemptSchema.parse(body)

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: {
        course: { columns: { id: true } },
        questions: {
          orderBy: (quizQuestions, { asc }) => [asc(quizQuestions.sortOrder)],
        },
      },
    })

    if (!quiz || !quiz.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Quiz not found or inactive" } },
        { status: 404 }
      )
    }

    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.studentId, payload.userId),
        eq(enrollments.courseId, quiz.courseId),
        eq(enrollments.status, "active")
      ),
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not enrolled in this course" } },
        { status: 403 }
      )
    }

    const weekUnlock = await db.query.weeklyUnlocks.findFirst({
      where: and(
        eq(weeklyUnlocks.enrollmentId, enrollment.id),
        eq(weeklyUnlocks.weekNumber, quiz.weekNumber ?? 0)
      ),
    })

    if (!weekUnlock) {
      return NextResponse.json(
        { success: false, error: { code: "LOCKED", message: `Week ${quiz.weekNumber} is not yet unlocked` } },
        { status: 403 }
      )
    }

    const existingAttempt = await db.query.quizAttempts.findFirst({
      where: and(
        eq(quizAttempts.quizId, quizId),
        eq(quizAttempts.studentId, payload.userId)
      ),
    })

    if (existingAttempt) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_ATTEMPTED", message: "You have already attempted this quiz" } },
        { status: 400 }
      )
    }

    let totalScore = 0
    let totalMarks = 0

    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i]
      const studentAnswers = answers[i.toString()] || []
      const correctAnswers = question.correctAnswers || []
      
      totalMarks += question.marks ?? 0

      const sortedStudent = [...studentAnswers].sort((a, b) => a - b)
      const sortedCorrect = [...correctAnswers].sort((a, b) => a - b)
      
      const isCorrect = JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect)
      
      if (isCorrect) {
        totalScore += question.marks ?? 0
      }
    }

    const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0
    const isPassed = percentage >= (quiz.passingMarks ?? 0)

    // ✅ FIXED: Include startedAt field from schema
    const [attempt] = await db.insert(quizAttempts).values({
      quizId,
      studentId: payload.userId,
      answers,
      score: totalScore,
      totalMarks,
      percentage,
      isPassed,
      timeTakenSeconds: timeTakenSeconds || 0,
      startedAt: new Date(),  // ✅ ADDED: startedAt from schema
      completedAt: new Date(),
    }).returning()

    await db.update(weeklyUnlocks)
      .set({ quizCompleted: true })
      .where(eq(weeklyUnlocks.id, weekUnlock.id))

    await checkAndMarkAttendance(enrollment.id, quiz.weekNumber)

    return NextResponse.json({
      success: true,
      data: {
        attempt: {
          ...attempt,
          score: totalScore,
          totalMarks,
          percentage,
          isPassed,
        },
        passed: isPassed,
      },
      message: isPassed 
        ? `Congratulations! You passed with ${percentage}%` 
        : `You scored ${percentage}%. Passing marks: ${quiz.passingMarks ?? 0}%`,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Quiz attempt error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to submit quiz" } },
      { status: 500 }
    )
  }
}

async function checkAndMarkAttendance(enrollmentId: string, weekNumber: number) {
  const weekUnlock = await db.query.weeklyUnlocks.findFirst({
    where: and(
      eq(weeklyUnlocks.enrollmentId, enrollmentId),
      eq(weeklyUnlocks.weekNumber, weekNumber)
    ),
  })

  if (!weekUnlock || weekUnlock.attendanceMarked) return

  const lessonsDone = (weekUnlock.lessonsCompleted || 0) >= 2
  const assignmentDone = weekUnlock.assignmentCompleted
  const quizDone = weekUnlock.quizCompleted

  if (lessonsDone && assignmentDone && quizDone) {
    await db.update(weeklyUnlocks)
      .set({ attendanceMarked: true, attendanceStatus: "present" })
      .where(eq(weeklyUnlocks.id, weekUnlock.id))

    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
    })

    if (enrollment) {
      await db.insert(attendance).values({
        enrollmentId,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        weekNumber,
        lessonsWatched: weekUnlock.lessonsCompleted,
        totalLessonsRequired: 2,
        assignmentSubmitted: true,
        quizSubmitted: true,
        status: "present",
        markedAt: new Date(),
        notes: "Auto-marked: All weekly requirements completed",
      }).onConflictDoNothing({
        target: [attendance.enrollmentId, attendance.weekNumber],
      })
    }
  }
}