import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { submissions, assignments, courses } from "../../../../db/schema"
import { eq, sql } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
export const dynamic = "force-dynamic"

// GET - Instructor views all submissions for their courses
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

    // Get instructor's courses
    const instructorCourses = await db.query.courses.findMany({
      where: eq(courses.instructorId, payload.userId),
      columns: { id: true },
    })

    const courseIds = instructorCourses.map(c => c.id)

    if (courseIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get assignments for these courses
    const courseAssignments = await db.query.assignments.findMany({
      where: sql`${assignments.courseId} IN (${sql.join(courseIds)})`,
      columns: { id: true },
    })

    const assignmentIds = courseAssignments.map(a => a.id)

    if (assignmentIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get all submissions with student details
    const allSubmissions = await db.query.submissions.findMany({
      where: sql`${submissions.assignmentId} IN (${sql.join(assignmentIds)})`,
      with: {
        student: {
          columns: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        assignment: {
          with: {
            course: { columns: { id: true, title: true } },
          },
        },
      },
      orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
    })

    return NextResponse.json({
      success: true,
      data: allSubmissions,
    })
  } catch (error) {
    console.error("Get instructor submissions error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch submissions" } },
      { status: 500 }
    )
  }
}