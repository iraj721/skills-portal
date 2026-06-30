import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../db"
import { assignments, courses, modules, submissions, users } from "../../../../../db/schema"
import { eq, desc } from "drizzle-orm"
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

    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Only select columns that exist in schema
    const assignmentResult = await db
      .select({
        id: assignments.id,
        courseId: assignments.courseId,
        moduleId: assignments.moduleId,
        title: assignments.title,
        description: assignments.description,
        instructions: assignments.instructions,
        dueDate: assignments.dueDate,
        totalMarks: assignments.totalMarks,
        createdAt: assignments.createdAt,
      })
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1)

    if (!assignmentResult || assignmentResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Assignment not found" } },
        { status: 404 }
      )
    }

    const assignment = assignmentResult[0]

    // Fetch course with instructor separately
    const courseResult = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        instructorId: courses.instructorId,
        status: courses.status,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .where(eq(courses.id, assignment.courseId))
      .limit(1)

    const instructorResult = courseResult.length > 0
      ? await db
          .select({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, courseResult[0].instructorId))
          .limit(1)
      : []

    // Fetch module - only columns that exist
    const moduleResult = assignment.moduleId
      ? await db
          .select({
            id: modules.id,
            title: modules.title,
            description: modules.description,
            courseId: modules.courseId,
            createdAt: modules.createdAt,
          })
          .from(modules)
          .where(eq(modules.id, assignment.moduleId))
          .limit(1)
      : []

    // Fetch submissions - only columns that exist
    const assignmentSubmissions = await db
      .select({
        id: submissions.id,
        assignmentId: submissions.assignmentId,
        studentId: submissions.studentId,
        content: submissions.content,
        marksObtained: submissions.marksObtained,
        feedback: submissions.feedback,
        status: submissions.status,
        submittedAt: submissions.submittedAt,
      })
      .from(submissions)
      .where(eq(submissions.assignmentId, id))
      .orderBy(desc(submissions.submittedAt))

    // Fetch student info for each submission
    const submissionsWithStudents = await Promise.all(
      assignmentSubmissions.map(async (sub) => {
        const studentResult = await db
          .select({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, sub.studentId))
          .limit(1)
        return {
          ...sub,
          student: studentResult[0] || null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        assignment: {
          ...assignment,
          course: courseResult[0]
            ? {
                ...courseResult[0],
                instructor: instructorResult[0] || null,
              }
            : null,
          module: moduleResult[0] || null,
        },
        submissions: submissionsWithStudents,
      },
    })
  } catch (error) {
    console.error("Get admin assignment error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch assignment" } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    await db.delete(submissions).where(eq(submissions.assignmentId, id))
    await db.delete(assignments).where(eq(assignments.id, id))

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully",
    })
  } catch (error) {
    console.error("Delete admin assignment error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete assignment" } },
      { status: 500 }
    )
  }
}