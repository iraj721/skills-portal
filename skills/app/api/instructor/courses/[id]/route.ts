import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../db"
import { courses, enrollments, modules, lessons } from "../../../../../db/schema"
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

    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.id, id),
        eq(courses.instructorId, payload.userId)
      ),
      with: {
        category: true,
        modules: {
          with: {
            lessons: {
              orderBy: (lessons, { asc }) => [asc(lessons.sortOrder)],
            },
          },
          orderBy: (modules, { asc }) => [asc(modules.sortOrder)],
        },
      },
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Course not found" } },
        { status: 404 }
      )
    }

    // Get enrolled students
    const students = await db.query.enrollments.findMany({
      where: eq(enrollments.courseId, id),
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
      orderBy: (enrollments, { desc }) => [desc(enrollments.enrolledAt)],
    })

    return NextResponse.json({
      success: true,
      data: {
        course,
        students,
      },
    })
  } catch (error) {
    console.error("Get instructor course error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch course" } },
      { status: 500 }
    )
  }
}