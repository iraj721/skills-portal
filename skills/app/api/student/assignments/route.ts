import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { assignments, submissions, enrollments, courses } from "../../../../db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"

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

    // Get student's enrolled courses
    const userEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.studentId, payload.userId),
    })

    const courseIds = userEnrollments.map((e) => e.courseId)

    if (courseIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Get assignments for enrolled courses
    const courseAssignments = await db.query.assignments.findMany({
      where: inArray(assignments.courseId, courseIds),
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
      orderBy: (assignments, { desc }) => [desc(assignments.createdAt)],
    })

    // Get student's submissions
    const userSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.studentId, payload.userId),
    })

    // Merge assignments with submissions
    const assignmentsWithSubmissions = courseAssignments.map((assignment) => {
      const submission = userSubmissions.find((s) => s.assignmentId === assignment.id)
      return {
        ...assignment,
        submission: submission || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: assignmentsWithSubmissions,
    })
  } catch (error) {
    console.error("Get student assignments error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch assignments" } },
      { status: 500 }
    )
  }
}