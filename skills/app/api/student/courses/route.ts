import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { enrollments, courses, modules, lessons, progress } from "../../../../db/schema"
import { eq, and, sql } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
export const dynamic = "force-dynamic"

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

    const userEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.studentId, payload.userId),
      with: {
        course: {
          with: {
            instructor: {
              columns: { id: true, fullName: true, avatarUrl: true },
            },
            category: {
              columns: { id: true, name: true },
            },
            modules: {
              with: {
                lessons: {
                  columns: { id: true, title: true, durationMinutes: true, isFreePreview: true },
                  orderBy: (lessons, { asc }) => [asc(lessons.sortOrder)],
                },
              },
              orderBy: (modules, { asc }) => [asc(modules.sortOrder)],
            },
          },
        },
        batch: true,
      },
      orderBy: (enrollments, { desc }) => [desc(enrollments.enrolledAt)],
    })

    const courseIds = userEnrollments.map(e => e.courseId)
    const allProgress = courseIds.length > 0
      ? await db.query.progress.findMany({
          where: eq(progress.studentId, payload.userId),
        })
      : []

    const progressMap = new Map(allProgress.map(p => [p.lessonId, p]))

    const enrichedEnrollments = userEnrollments.map(enrollment => {
      const course = enrollment.course
      const totalLessons = course.modules?.reduce(
        (acc, mod) => acc + (mod.lessons?.length || 0), 0
      ) || 0

      const completedLessons = course.modules?.reduce((acc, mod) => {
        return acc + (mod.lessons?.filter(l => progressMap.get(l.id)?.isCompleted).length || 0)
      }, 0) || 0

      return {
        id: enrollment.id,
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        thumbnailUrl: course.thumbnailUrl,
        shortDescription: course.shortDescription,
        instructor: course.instructor,
        category: course.category,
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
        completedLessons,
        totalLessons,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        lastAccessedAt: enrollment.lastAccessedAt,
        batchName: enrollment.batch?.name,
        modules: course.modules?.map(mod => ({
          id: mod.id,
          title: mod.title,
          lessons: mod.lessons?.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            durationMinutes: lesson.durationMinutes,
            isFreePreview: lesson.isFreePreview,
            isCompleted: progressMap.get(lesson.id)?.isCompleted || false,
            watchedPercent: progressMap.get(lesson.id)?.watchedPercent || 0,
          })),
        })),
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedEnrollments,
    })
  } catch (error) {
    console.error("Get student courses error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch courses" } },
      { status: 500 }
    )
  }
}