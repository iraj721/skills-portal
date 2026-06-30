import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { assignments, courses, modules, submissions, users } from "../../../../db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { z } from "zod"
export const dynamic = "force-dynamic"

const assignmentSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  moduleId: z.string().uuid().optional().nullable(),
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

    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    // Only select columns that exist in schema
    const allAssignments = await db
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
      .orderBy(desc(assignments.createdAt))

    // Fetch related data separately
    const assignmentsWithRelations = await Promise.all(
      allAssignments.map(async (assignment) => {
        // Fetch course
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

        // Count submissions
        const submissionCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(submissions)
          .where(eq(submissions.assignmentId, assignment.id))

        return {
          ...assignment,
          course: courseResult[0]
            ? {
                ...courseResult[0],
                instructor: instructorResult[0] || null,
              }
            : null,
          module: moduleResult[0] || null,
          submissions: Number(submissionCount[0]?.count || 0),
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: assignmentsWithRelations,
    })
  } catch (error) {
    console.error("Get admin assignments error:", error)
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

    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = assignmentSchema.parse(body)

    // Verify course exists
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, data.courseId))
      .limit(1)

    if (!course || course.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Course not found" } },
        { status: 404 }
      )
    }

    const [assignment] = await db.insert(assignments).values({
      courseId: data.courseId,
      moduleId: data.moduleId,
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
    console.error("Create admin assignment error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create assignment" } },
      { status: 500 }
    )
  }
}