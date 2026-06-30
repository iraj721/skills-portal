import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../db"
import { batches, batchCourses, courses, categories } from "../../../db/schema"
import { eq, and, sql, desc } from "drizzle-orm"
import { verifyToken } from "../../../lib/auth"
import { z } from "zod"

const batchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  batchNumber: z.number().min(1, "Batch number is required"),
  enrollmentOpenDate: z.string().datetime("Invalid open date"),
  enrollmentCloseDate: z.string().datetime("Invalid close date"),
  batchStartDate: z.string().datetime("Invalid start date").optional(),
  batchEndDate: z.string().datetime("Invalid end date").optional(),
  description: z.string().optional(),
  maxCoursesPerStudent: z.number().min(1).max(5).default(3),
  freelancingCompulsory: z.boolean().default(true),
})

// GET /api/batches - Get all batches (admin/instructor) or current open batch (student)
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
    const { searchParams } = request.nextUrl  // ✅ Use request.nextUrl instead of new URL()
    const current = searchParams.get("current") === "true"

    // If student asks for current batch, return only open batch
    if (current || payload.role === "student") {
      const now = new Date()
      
      const openBatch = await db.query.batches.findFirst({
        where: and(
          eq(batches.status, "open"),
          sql`${batches.enrollmentOpenDate} <= ${now}`,
          sql`${batches.enrollmentCloseDate} >= ${now}`
        ),
        with: {
          batchCourses: {
            with: {
              course: {
                with: {
                  instructor: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: desc(batches.createdAt),
      })

      if (!openBatch) {
        // Check for upcoming batch
        const upcomingBatch = await db.query.batches.findFirst({
          where: eq(batches.status, "upcoming"),
          orderBy: desc(batches.createdAt),
        })

        return NextResponse.json({
          success: true,
          data: {
            currentBatch: null,
            upcomingBatch: upcomingBatch || null,
            isEnrollmentOpen: false,
            message: upcomingBatch 
              ? `Next batch opens on ${new Date(upcomingBatch.enrollmentOpenDate).toLocaleDateString()}`
              : "No upcoming batches scheduled",
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          currentBatch: openBatch,
          isEnrollmentOpen: true,
          enrollmentDeadline: openBatch.enrollmentCloseDate,
        },
      })
    }

    // Admin/Instructor: Get all batches
    const allBatches = await db.query.batches.findMany({
      with: {
        batchCourses: {
          with: {
            course: true,
          },
        },
      },
      orderBy: desc(batches.createdAt),
    })

    return NextResponse.json({
      success: true,
      data: allBatches,
    })
  } catch (error) {
    console.error("Get batches error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch batches" } },
      { status: 500 }
    )
  }
}

// POST /api/batches - Create new batch (admin only)
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
        { success: false, error: { code: "AUTH_002", message: "Only admin can create batches" } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = batchSchema.parse(body)

    // Check if batch number already exists
    const existing = await db.query.batches.findFirst({
      where: eq(batches.batchNumber, data.batchNumber),
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Batch number already exists" } },
        { status: 400 }
      )
    }

    // Auto-set status based on dates
    const now = new Date()
    const openDate = new Date(data.enrollmentOpenDate)
    const closeDate = new Date(data.enrollmentCloseDate)

    let status: "upcoming" | "open" | "closed" = "upcoming"
    if (now >= openDate && now <= closeDate) {
      status = "open"
    } else if (now > closeDate) {
      status = "closed"
    }

    const [batch] = await db.insert(batches).values({
      name: data.name,
      batchNumber: data.batchNumber,
      status,
      enrollmentOpenDate: openDate,
      enrollmentCloseDate: closeDate,
      batchStartDate: data.batchStartDate ? new Date(data.batchStartDate) : null,
      batchEndDate: data.batchEndDate ? new Date(data.batchEndDate) : null,
      description: data.description,
      maxCoursesPerStudent: data.maxCoursesPerStudent,
      freelancingCompulsory: data.freelancingCompulsory,
    }).returning()

    return NextResponse.json({
      success: true,
      data: batch,
      message: "Batch created successfully",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Create batch error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create batch" } },
      { status: 500 }
    )
  }
}