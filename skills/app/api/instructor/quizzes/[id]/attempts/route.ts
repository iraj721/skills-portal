import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../../db"
import { quizAttempts, quizzes, courses, users } from "../../../../../../db/schema"
import { eq, and } from "drizzle-orm"
import { verifyToken } from "../../../../../../lib/auth"

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

    // Get quiz with course info
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, id),
      with: {
        course: {
          columns: { id: true, instructorId: true },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Quiz not found" } },
        { status: 404 }
      )
    }

    // Check authorization
    const isOwner = quiz.course?.instructorId === payload.userId
    const isAdmin = payload.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized" } },
        { status: 403 }
      )
    }

    // Get attempts with student info
    const attempts = await db.query.quizAttempts.findMany({
      where: eq(quizAttempts.quizId, id),
      with: {
        student: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: (quizAttempts, { desc }) => [desc(quizAttempts.completedAt)],
    })

    return NextResponse.json({
      success: true,
      data: attempts,
    })
  } catch (error) {
    console.error("Get quiz attempts error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch attempts" } },
      { status: 500 }
    )
  }
}