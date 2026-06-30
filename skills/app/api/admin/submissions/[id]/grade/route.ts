import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../../db"
import { submissions, assignments } from "../../../../../../db/schema"
import { eq } from "drizzle-orm"
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

    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const data = gradeSchema.parse(body)

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, id),
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
    })

    if (!submission) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Submission not found" } },
        { status: 404 }
      )
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, submission.assignmentId),
    })

    if (assignment && assignment.totalMarks !== null && data.marksObtained > assignment.totalMarks) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Marks cannot exceed ${assignment.totalMarks}` } },
        { status: 400 }
      )
    }

    const [updated] = await db.update(submissions)
      .set({
        marksObtained: data.marksObtained,
        feedback: data.feedback,
        status: data.status,
        gradedAt: new Date(),
        gradedBy: payload.userId,
      })
      .where(eq(submissions.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      data: { ...updated, student: submission.student },
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