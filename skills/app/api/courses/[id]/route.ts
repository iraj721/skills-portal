import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { courses, enrollments } from "../../../../db/schema"
import { eq, or, sql } from "drizzle-orm"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // FIX: Check both slug and id for lookup
    const course = await db.query.courses.findFirst({
      where: or(eq(courses.slug, id), eq(courses.id, id)),
      with: {
        instructor: true,
        category: true,
        modules: {
          with: {
            lessons: true,
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

    const enrollmentCount = await db.select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.courseId, course.id))

    const totalStudents = enrollmentCount[0]?.count || 0
    const totalLessons = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        totalStudents,
        totalLessons,
      },
    })
  } catch (error) {
    console.error("Get course error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch course" } },
      { status: 500 }
    )
  }
}