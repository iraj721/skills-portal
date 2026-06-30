import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../db"
import { weeklyUnlocks, enrollments, progress, lessons, modules } from "../../../../../db/schema"
import { eq, and, sql } from "drizzle-orm"
import { verifyToken } from "../../../../../lib/auth"
import { z } from "zod"

const lessonCompleteSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID"),
  courseId: z.string().uuid("Invalid course ID"),
})

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
    const { lessonId, courseId } = lessonCompleteSchema.parse(body)

    // Verify enrollment
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.studentId, payload.userId),
        eq(enrollments.courseId, courseId),
        eq(enrollments.status, "active")
      ),
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not enrolled in this course" } },
        { status: 403 }
      )
    }

    // Get lesson info to determine week
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      with: {
        module: true,
      },
    })

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Lesson not found" } },
        { status: 404 }
      )
    }

    // Calculate week number based on lesson position
    const allModules = await db.query.modules.findMany({
      where: eq(modules.courseId, courseId),
      with: {
        lessons: {
          orderBy: (lessons, { asc }) => [asc(lessons.sortOrder)],
        },
      },
      orderBy: (modules, { asc }) => [asc(modules.sortOrder)],
    })

    let lessonCount = 0
    let weekNumber = 1
    for (const mod of allModules) {
      for (const les of mod.lessons) {
        lessonCount++
        if (les.id === lessonId) {
          weekNumber = Math.ceil(lessonCount / 2) // 2 lessons per week
          break
        }
      }
    }

    // Update or create weekly unlock
    const existingUnlock = await db.query.weeklyUnlocks.findFirst({
      where: and(
        eq(weeklyUnlocks.enrollmentId, enrollment.id),
        eq(weeklyUnlocks.weekNumber, weekNumber)
      ),
    })

    if (existingUnlock) {
      const newLessonsCompleted = (existingUnlock.lessonsCompleted || 0) + 1
      await db.update(weeklyUnlocks)
        .set({
          lessonsCompleted: newLessonsCompleted,
        })
        .where(eq(weeklyUnlocks.id, existingUnlock.id))
    }

    return NextResponse.json({
      success: true,
      message: "Lesson completion recorded",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Lesson complete error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to record lesson completion" } },
      { status: 500 }
    )
  }
}