import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../../db"
import { submissions, assignments, courses } from "../../../../../../db/schema"
import { eq, and } from "drizzle-orm"
import { verifyToken } from "../../../../../../lib/auth"
import { z } from "zod"

const gradeSchema = z.object({
  marksObtained: z.number().min(0),
  feedback: z.string().optional(),
  status: z.enum(["graded", "resubmit"]),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    const { id } = await params  // FIX: Added await
    const body = await request.json()
    const { marksObtained, feedback, status } = gradeSchema.parse(body)

    // Get submission
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, id),
      with: {
        assignment: true,
      },
    })

    if (!submission) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Submission not found" } },
        { status: 404 }
      )
    }

    // Verify instructor owns the course
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, submission.assignment.courseId),
    })

    if (!course || course.instructorId !== payload.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      )
    }

    // Validate marks don't exceed total
    const totalMarks = submission.assignment.totalMarks ?? 100
    if (marksObtained > totalMarks) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Marks cannot exceed total marks" } },
        { status: 400 }
      )
    }

    const [graded] = await db.update(submissions)
      .set({
        marksObtained,
        feedback: feedback || null,
        status,
        gradedAt: new Date(),
        gradedBy: payload.userId,
      })
      .where(eq(submissions.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      data: graded,
      message: "Submission graded successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Grade submission error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to grade submission" } },
      { status: 500 }
    )
  }
}