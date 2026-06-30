import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../db"
import { courses, enrollments } from "../../../db/schema"
import { eq, sql, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const allCourses = await db.query.courses.findMany({
      where: eq(courses.status, "published"),
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

    // Get enrollment counts for all courses
    const enrollmentCounts = await db.select({
      courseId: enrollments.courseId,
      count: sql<number>`count(*)`,
    })
      .from(enrollments)
      .groupBy(enrollments.courseId)

    const enrollmentMap = new Map()
    enrollmentCounts.forEach((row) => {
      enrollmentMap.set(row.courseId, Number(row.count))
    })

    const coursesWithStats = allCourses.map((course) => {
      const totalStudents = enrollmentMap.get(course.id) || 0
      const totalLessons = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0

      return {
        ...course,
        totalStudents,
        totalLessons,
      }
    })

    return NextResponse.json({
      success: true,
      data: coursesWithStats,
    })
  } catch (error) {
    console.error("Get courses error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch courses" } },
      { status: 500 }
    )
  }
}