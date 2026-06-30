import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../db"
import { assignments, submissions } from "../../../../../db/schema"
import { eq, and } from "drizzle-orm"
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
        course: {
          columns: {
            id: true,
            title: true,
          },
        },
        module: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Assignment not found" } },
        { status: 404 }
      )
    }

    const submission = await db.query.submissions.findFirst({
      where: and(
        eq(submissions.assignmentId, id),
        eq(submissions.studentId, payload.userId)
      ),
    })

    return NextResponse.json({
      success: true,
      data: {
        assignment,
        submission,
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