import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../db"
import { progress, enrollments, lessons, modules } from "../../../db/schema"
import { eq, and, sql } from "drizzle-orm"
import { verifyToken } from "../../../lib/auth"
import { z } from "zod"

const progressSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID"),
  isCompleted: z.boolean().default(true),
  watchedPercent: z.number().min(0).max(100).optional(),
})

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
    const { searchParams } = request.nextUrl
    const courseId = searchParams.get("courseId")

    if (courseId) {
      const courseProgress = await db.select({
        id: progress.id,
        lessonId: progress.lessonId,
        isCompleted: progress.isCompleted,
        watchedPercent: progress.watchedPercent,
        completedAt: progress.completedAt,
      })
      .from(progress)
      .innerJoin(lessons, eq(progress.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(and(
        eq(progress.studentId, payload.userId),
        eq(modules.courseId, courseId)
      ))

      return NextResponse.json({
        success: true,
        data: courseProgress,
      })
    }

    const allProgress = await db.query.progress.findMany({
      where: eq(progress.studentId, payload.userId),
    })

    return NextResponse.json({
      success: true,
      data: allProgress,
    })
  } catch (error) {
    console.error("Get progress error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch progress" } },
      { status: 500 }
    )
  }
}

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
    const { lessonId, isCompleted, watchedPercent } = progressSchema.parse(body)

    // FIX: Use transaction to prevent race condition
    const result = await db.transaction(async (tx) => {
      const existing = await tx.query.progress.findFirst({
        where: and(
          eq(progress.studentId, payload.userId),
          eq(progress.lessonId, lessonId)
        ),
      })

      let result

      if (existing) {
        const [updated] = await tx.update(progress)
          .set({
            isCompleted: isCompleted || existing.isCompleted,
            watchedPercent: watchedPercent || existing.watchedPercent,
            completedAt: isCompleted ? new Date() : existing.completedAt,
          })
          .where(eq(progress.id, existing.id))
          .returning()
        result = updated
      } else {
        const [created] = await tx.insert(progress).values({
          studentId: payload.userId,
          lessonId,
          isCompleted: isCompleted || false,
          watchedPercent: watchedPercent || 0,
          completedAt: isCompleted ? new Date() : null,
        }).returning()
        result = created
      }

      const lesson = await tx.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        with: { module: true },
      })

      if (lesson) {
        const courseId = lesson.module.courseId

        const allModules = await tx.query.modules.findMany({
          where: eq(modules.courseId, courseId),
          with: { lessons: true },
        })

        const totalLessons = allModules.reduce((acc, mod) => acc + mod.lessons.length, 0)

        const completedLessonsResult = await tx.select({ 
          count: sql<number>`count(*)` 
        })
        .from(progress)
        .innerJoin(lessons, eq(progress.lessonId, lessons.id))
        .innerJoin(modules, eq(lessons.moduleId, modules.id))
        .where(and(
          eq(progress.studentId, payload.userId),
          eq(modules.courseId, courseId),
          eq(progress.isCompleted, true)
        ))

        const completedCount = Number(completedLessonsResult[0]?.count || 0)
        const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

        await tx.update(enrollments)
          .set({
            progressPercent,
            status: progressPercent === 100 ? "completed" : "active",
            completedAt: progressPercent === 100 ? new Date() : null,
            lastAccessedAt: new Date(),
          })
          .where(and(
            eq(enrollments.studentId, payload.userId),
            eq(enrollments.courseId, courseId)
          ))
      }

      return result
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: "Progress updated",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Update progress error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update progress" } },
      { status: 500 }
    )
  }
}