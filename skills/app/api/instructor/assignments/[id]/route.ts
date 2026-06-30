import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../db"
import { assignments, courses, submissions, users } from "../../../../../db/schema"
import { eq, and, sql } from "drizzle-orm"
import { verifyToken } from "../../../../../lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, id),
      with: {
        course: true,
        module: true,
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Assignment not found" } },
        { status: 404 }
      )
    }

    // Verify instructor owns the course
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, assignment.courseId),
    })

    if (!course || course.instructorId !== payload.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      )
    }

    // Get submissions with student details
    const assignmentSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.assignmentId, id),
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
      orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
    })

    return NextResponse.json({
      success: true,
      data: {
        assignment,
        submissions: assignmentSubmissions,
      },
    })
  } catch (error) {
    console.error("Get assignment error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch assignment" } },
      { status: 500 }
    )
  }
}