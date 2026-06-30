import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { assignments, courses, submissions } from "../../../../db/schema"
import { eq, sql, inArray } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { z } from "zod"

const assignmentSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  moduleId: z.string().uuid().optional().nullable(),
  weekNumber: z.number().min(1).max(8).optional(),  // ✅ ADDED: weekNumber from schema
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().min(10, "Instructions are required"),
  dueDate: z.string().optional().nullable(),
  totalMarks: z.number().min(1).max(1000).default(100),
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

    // Get instructor's courses
    const instructorCourses = await db.query.courses.findMany({
      where: eq(courses.instructorId, payload.userId),
      columns: { id: true },
    })

    const courseIds = instructorCourses.map((c) => c.id)

    if (courseIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Get assignments for these courses
    const instructorAssignments = await db.query.assignments.findMany({
      where: inArray(assignments.courseId, courseIds),
      with: {
        course: {
          columns: {
            id: true,
            title: true,
          },
        },
        module: {
          columns: {
            id: true,
            title: true,
          },
        },
        submissions: true,
      },
      orderBy: (assignments, { desc }) => [desc(assignments.createdAt)],
    })

    return NextResponse.json({
      success: true,
      data: instructorAssignments,
    })
  } catch (error) {
    console.error("Get instructor assignments error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch assignments" } },
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
    const data = assignmentSchema.parse(body)

    // Verify course belongs to instructor
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, data.courseId),
    })

    if (!course || course.instructorId !== payload.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You don't own this course" } },
        { status: 403 }
      )
    }

    // ✅ FIXED: Include weekNumber in insert
    const [assignment] = await db.insert(assignments).values({
      courseId: data.courseId,
      moduleId: data.moduleId,
      weekNumber: data.weekNumber,  // ✅ ADDED
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      totalMarks: data.totalMarks,
    }).returning()

    return NextResponse.json({
      success: true,
      data: assignment,
      message: "Assignment created successfully",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Create assignment error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create assignment" } },
      { status: 500 }
    )
  }
}