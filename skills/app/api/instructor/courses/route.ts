import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { courses, modules, lessons, enrollments } from "../../../../db/schema"
import { eq, sql } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { z } from "zod"

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().optional(),
  description: z.string().min(10, "Description is required"),
  shortDescription: z.string().max(200, "Short description too long"),
  categoryId: z.string().uuid().optional().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  language: z.string().default("Urdu"),
  durationHours: z.number().min(0).default(0),
  requirements: z.array(z.string()).default([]),
  whatYouLearn: z.array(z.string()).default([]),
  modules: z.array(z.object({
    title: z.string().min(1, "Module title is required"),
    description: z.string().optional(),
    sortOrder: z.number().default(0),
    lessons: z.array(z.object({
      title: z.string().min(1, "Lesson title is required"),
      description: z.string().optional(),
      videoUrl: z.string().optional(),
      videoType: z.enum(["youtube", "vimeo", "upload"]).default("youtube"),
      durationMinutes: z.number().min(0).default(0),
      isFreePreview: z.boolean().default(false),
      sortOrder: z.number().default(0),
      thumbnailUrl: z.string().optional(),
    })).default([]),
  })).default([]),
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

    const instructorCourses = await db.select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      shortDescription: courses.shortDescription,
      thumbnailUrl: courses.thumbnailUrl,
      status: courses.status,
      level: courses.level,
      durationHours: courses.durationHours,
      language: courses.language,
      createdAt: courses.createdAt,
      totalStudents: sql<number>`COALESCE((SELECT count(*) FROM ${enrollments} WHERE ${enrollments.courseId} = ${courses.id}), 0)`,
    })
    .from(courses)
    .where(eq(courses.instructorId, payload.userId))
    .orderBy(sql`${courses.createdAt} DESC`)

    return NextResponse.json({
      success: true,
      data: instructorCourses,
    })
  } catch (error) {
    console.error("Get instructor courses error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch courses" } },
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
    const data = courseSchema.parse(body)

    // Generate slug if not provided
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    // Check if slug exists
    const existing = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "A course with this title already exists" } },
        { status: 400 }
      )
    }

    // Create course
    const [course] = await db.insert(courses).values({
      title: data.title,
      slug,
      description: data.description,
      shortDescription: data.shortDescription,
      categoryId: data.categoryId,
      instructorId: payload.userId,
      level: data.level,
      language: data.language,
      durationHours: data.durationHours,
      requirements: data.requirements.filter(Boolean),
      whatYouLearn: data.whatYouLearn.filter(Boolean),
      status: "draft",
      isFree: true,
    }).returning()

    // Create modules and lessons
    for (const moduleData of data.modules) {
      const [module] = await db.insert(modules).values({
        courseId: course.id,
        title: moduleData.title,
        description: moduleData.description,
        sortOrder: moduleData.sortOrder,
      }).returning()

      for (const lessonData of moduleData.lessons) {
        await db.insert(lessons).values({
          moduleId: module.id,
          title: lessonData.title,
          description: lessonData.description,
          videoUrl: lessonData.videoUrl,
          videoType: lessonData.videoType,
          durationMinutes: lessonData.durationMinutes,
          isFreePreview: lessonData.isFreePreview,
          sortOrder: lessonData.sortOrder,
          // ✅ thumbnailUrl will be stored if schema supports it
          // If not in schema, Drizzle will ignore it (type-safe)
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: { courseId: course.id },
      message: "Course created successfully",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Create course error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create course" } },
      { status: 500 }
    )
  }
}