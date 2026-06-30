import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../db"
import { quizzes, quizQuestions, courses, quizAttempts } from "../../../../../db/schema"
import { eq, and, count } from "drizzle-orm"
import { verifyToken } from "../../../../../lib/auth"
import { z } from "zod"

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(1, "Question is required"),
  questionType: z.enum(["mcq", "true_false", "multiple_select"]).default("mcq"),
  options: z.array(z.string()).min(2, "At least 2 options required"),
  correctAnswers: z.array(z.number()).min(1, "At least one correct answer required"),
  explanation: z.string().optional(),
  marks: z.number().min(1).default(10),
  sortOrder: z.number().default(0),
})

const quizUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  timeLimitMinutes: z.number().min(1).max(120).optional(),
  passingMarks: z.number().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  questions: z.array(questionSchema).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, id),
      with: {
        course: {
          columns: { id: true, title: true, instructorId: true },
        },
        questions: {
          orderBy: (quizQuestions, { asc }) => [asc(quizQuestions.sortOrder)],
        },
        attempts: {
          columns: { id: true },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Quiz not found" } },
        { status: 404 }
      )
    }

    const isInstructor = quiz.course?.instructorId === payload.userId
    const isAdmin = payload.role === "admin"
    
    if (!isInstructor && !isAdmin && payload.role !== "student") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      )
    }

    const sanitizedQuiz = payload.role === "student" 
      ? {
          ...quiz,
          questions: quiz.questions?.map(q => ({
            id: q.id,
            question: q.question,
            questionType: q.questionType,
            options: q.options,
            marks: q.marks,
            sortOrder: q.sortOrder,
          })),
        }
      : quiz

    return NextResponse.json({
      success: true,
      data: sanitizedQuiz,
    })
  } catch (error) {
    console.error("Get quiz error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch quiz" } },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params
    const body = await request.json()
    const data = quizUpdateSchema.parse(body)

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, id),
      with: { course: { columns: { instructorId: true } } },
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Quiz not found" } },
        { status: 404 }
      )
    }

    const isOwner = quiz.course?.instructorId === payload.userId
    const isAdmin = payload.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized" } },
        { status: 403 }
      )
    }

    const attemptResult = await db.select({ count: count() }).from(quizAttempts).where(eq(quizAttempts.quizId, id))
    const attemptCount = attemptResult[0]?.count ?? 0
    
    if (attemptCount > 0 && data.questions) {
      return NextResponse.json(
        { success: false, error: { code: "LOCKED", message: "Cannot edit quiz that has student attempts. Create a new version instead." } },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.timeLimitMinutes !== undefined) updateData.timeLimitMinutes = data.timeLimitMinutes
    if (data.passingMarks !== undefined) updateData.passingMarks = data.passingMarks
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (Object.keys(updateData).length > 0) {
      await db.update(quizzes)
        .set(updateData)
        .where(eq(quizzes.id, id))
    }

    if (data.questions && attemptCount === 0) {
      await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id))
      
      for (const q of data.questions) {
        await db.insert(quizQuestions).values({
          quizId: id,
          question: q.question,
          questionType: q.questionType,
          options: q.options,
          correctAnswers: q.correctAnswers,
          explanation: q.explanation,
          marks: q.marks,
          sortOrder: q.sortOrder,
        })
      }

      const newTotalMarks = data.questions.reduce((sum, q) => sum + q.marks, 0)
      await db.update(quizzes)
        .set({ totalMarks: newTotalMarks })
        .where(eq(quizzes.id, id))
    }

    return NextResponse.json({
      success: true,
      message: "Quiz updated successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Update quiz error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update quiz" } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, id),
      with: { course: { columns: { instructorId: true } } },
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Quiz not found" } },
        { status: 404 }
      )
    }

    const isOwner = quiz.course?.instructorId === payload.userId
    const isAdmin = payload.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized" } },
        { status: 403 }
      )
    }

    await db.delete(quizzes).where(eq(quizzes.id, id))

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully",
    })
  } catch (error) {
    console.error("Delete quiz error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete quiz" } },
      { status: 500 }
    )
  }
}