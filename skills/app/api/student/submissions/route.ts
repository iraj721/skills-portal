import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { submissions, assignments, enrollments } from "../../../../db/schema"
import { eq, and } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { z } from "zod"

const submissionSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  content: z.string().min(1, "Content is required"),
  attachmentUrl: z.string().optional(),
})

// GET - Student views their own submissions
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

    const userSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.studentId, payload.userId),
      with: {
        assignment: {
          with: {
            course: {
              columns: { id: true, title: true },
            },
          },
        },
      },
      orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
    })

    return NextResponse.json({
      success: true,
      data: userSubmissions,
    })
  } catch (error) {
    console.error("Get student submissions error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch submissions" } },
      { status: 500 }
    )
  }
}

// POST - Student submits assignment
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
    const { assignmentId, content, attachmentUrl } = submissionSchema.parse(body)

    // Get assignment
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Assignment not found" } },
        { status: 404 }
      )
    }

    // Check if student is enrolled in the course
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.studentId, payload.userId),
        eq(enrollments.courseId, assignment.courseId),
        eq(enrollments.status, "active")
      ),
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not enrolled in this course" } },
        { status: 403 }
      )
    }

    // Check due date
    if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: "OVERDUE", message: "Assignment submission deadline has passed" } },
        { status: 400 }
      )
    }

    // Check if already submitted
    const existing = await db.query.submissions.findFirst({
      where: and(
        eq(submissions.assignmentId, assignmentId),
        eq(submissions.studentId, payload.userId)
      ),
    })

    let result

    if (existing) {
      // Update submission
      const [updated] = await db.update(submissions)
        .set({
          content,
          attachmentUrl: attachmentUrl || existing.attachmentUrl,
          status: "submitted",
          submittedAt: new Date(),
        })
        .where(eq(submissions.id, existing.id))
        .returning()
      result = updated
    } else {
      // Create new submission
      const [created] = await db.insert(submissions).values({
        assignmentId,
        studentId: payload.userId,
        content,
        attachmentUrl: attachmentUrl || null,
        status: "submitted",
        submittedAt: new Date(),
      }).returning()
      result = created
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Assignment submitted successfully",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Submission error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to submit assignment" } },
      { status: 500 }
    )
  }
}