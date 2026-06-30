import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../db"
import { batchCourses, courses, categories } from "../../../../../db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { verifyToken } from "../../../../../lib/auth"
import { z } from "zod"

const batchCourseSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  isFreelancing: z.boolean().default(false),
})

// GET courses in a batch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Authorization: only admin/instructor can view batch courses
    if (payload.role !== "admin" && payload.role !== "instructor") {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_002", message: "Unauthorized" } },
        { status: 403 }
      )
    }

    const batchCourseList = await db.query.batchCourses.findMany({
      where: eq(batchCourses.batchId, id),
      with: {
        course: {
          with: {
            category: true,
            instructor: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: batchCourseList,
    })
  } catch (error) {
    console.error("Get batch courses error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch batch courses" } },
      { status: 500 }
    )
  }
}

// POST - Add course to batch (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, error: { code: "AUTH_002", message: "Unauthorized" } },
        { status: 403 }
      )
    }

    const { id: batchId } = await params
    const body = await request.json()
    const { courseId, isFreelancing } = batchCourseSchema.parse(body)

    // Check if course already in batch
    const existing = await db.query.batchCourses.findFirst({
      where: and(
        eq(batchCourses.batchId, batchId),
        eq(batchCourses.courseId, courseId)
      ),
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Course already in this batch" } },
        { status: 400 }
      )
    }

    // Verify course exists and is published
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Course not found" } },
        { status: 404 }
      )
    }

    // If isFreelancing, verify it's actually freelancing category
    if (isFreelancing && course.categoryId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, course.categoryId),
      })
      if (category?.slug !== "freelancing") {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Selected course is not a Freelancing course" } },
          { status: 400 }
        )
      }
    }

    const [batchCourse] = await db.insert(batchCourses).values({
      batchId,
      courseId,
      isFreelancing,
    }).returning()

    return NextResponse.json({
      success: true,
      data: batchCourse,
      message: "Course added to batch successfully",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Add batch course error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to add course to batch" } },
      { status: 500 }
    )
  }
}

// DELETE - Remove course from batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, error: { code: "AUTH_002", message: "Unauthorized" } },
        { status: 403 }
      )
    }

    const { id: batchId } = await params
    const { searchParams } = request.nextUrl
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Course ID required" } },
        { status: 400 }
      )
    }

    await db.delete(batchCourses)
      .where(and(
        eq(batchCourses.batchId, batchId),
        eq(batchCourses.courseId, courseId)
      ))

    return NextResponse.json({
      success: true,
      message: "Course removed from batch",
    })
  } catch (error) {
    console.error("Remove batch course error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to remove course" } },
      { status: 500 }
    )
  }
}