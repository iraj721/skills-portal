import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { quizzes, quizQuestions, courses } from "../../../../db/schema"
import { eq, and, desc, inArray } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { z } from "zod"
export const dynamic = "force-dynamic"

const questionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  questionType: z.enum(["mcq", "true_false", "multiple_select"]).default("mcq"),
  options: z.array(z.string()).min(2, "At least 2 options required"),
  correctAnswers: z.array(z.number()).min(1, "At least one correct answer required"),
  explanation: z.string().optional(),
  marks: z.number().min(1).default(10),
  sortOrder: z.number().default(0),
})

const quizSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  moduleId: z.string().uuid().optional().nullable(),
  weekNumber: z.number().min(1).max(8, "Week number must be 1-8"),
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  timeLimitMinutes: z.number().min(1).max(120).default(15),
  passingMarks: z.number().min(1).max(100).default(50),
  questions: z.array(questionSchema).min(1, "At least one question required"),
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
    
    const instructorCourses = await db.query.courses.findMany({
      where: eq(courses.instructorId, payload.userId),
      columns: { id: true },
    })
    
    const courseIds = instructorCourses.map(c => c.id)
    
    if (courseIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const allQuizzes = await db.query.quizzes.findMany({
      where: inArray(quizzes.courseId, courseIds),
      with: {
        course: {
          columns: { id: true, title: true },
        },
        questions: true,
        attempts: {
          columns: { id: true },
        },
      },
      orderBy: [desc(quizzes.createdAt)],
    })

    return NextResponse.json({
      success: true,
      data: allQuizzes,
    })
  } catch (error) {
    console.error("Get instructor quizzes error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch quizzes" } },
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
    const data = quizSchema.parse(body)

    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.id, data.courseId),
        eq(courses.instructorId, payload.userId)
      ),
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Course not found or not yours" } },
        { status: 403 }
      )
    }

    const existingQuiz = await db.query.quizzes.findFirst({
      where: and(
        eq(quizzes.courseId, data.courseId),
        eq(quizzes.weekNumber, data.weekNumber)
      ),
    })

    if (existingQuiz) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Quiz for Week ${data.weekNumber} already exists for this course` } },
        { status: 400 }
      )
    }

    const calculatedTotalMarks = data.questions.reduce((sum, q) => sum + q.marks, 0)

    const [quiz] = await db.insert(quizzes).values({
      courseId: data.courseId,
      moduleId: data.moduleId,
      weekNumber: data.weekNumber,
      title: data.title,
      description: data.description,
      timeLimitMinutes: data.timeLimitMinutes,
      passingMarks: data.passingMarks,
      totalMarks: calculatedTotalMarks,
    }).returning()

    for (const q of data.questions) {
      await db.insert(quizQuestions).values({
        quizId: quiz.id,
        question: q.question,
        questionType: q.questionType,
        options: q.options,
        correctAnswers: q.correctAnswers,
        explanation: q.explanation,
        marks: q.marks,
        sortOrder: q.sortOrder,
      })
    }

    return NextResponse.json({
      success: true,
      data: { quizId: quiz.id },
      message: "Quiz created successfully",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Create quiz error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create quiz" } },
      { status: 500 }
    )
  }
}