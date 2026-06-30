import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../db"
import { enrollments, courses, categories, batches, batchCourses } from "../../../db/schema"
import { eq, and, sql } from "drizzle-orm"
import { verifyToken } from "../../../lib/auth"
import { z } from "zod"

const enrollmentSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
})

const FREELANCING_SLUG = "freelancing"

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
            instructor: true,
            category: true,
          },
        },
        batch: true,
      },
      orderBy: (enrollments, { desc }) => [desc(enrollments.enrolledAt)],
    })

    return NextResponse.json({
      success: true,
      data: userEnrollments,
    })
  } catch (error) {
    console.error("Get enrollments error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch enrollments" } },
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
    const { courseId } = enrollmentSchema.parse(body)

    const now = new Date()
    const activeBatch = await db.query.batches.findFirst({
      where: and(
        eq(batches.status, "open"),
        sql`${batches.enrollmentOpenDate} <= ${now}`,
        sql`${batches.enrollmentCloseDate} >= ${now}`
      ),
    })

    if (!activeBatch) {
      return NextResponse.json(
        { success: false, error: { code: "BATCH_CLOSED", message: "No active batch found. Enrollment is currently closed." } },
        { status: 403 }
      )
    }

    const batchCourse = await db.query.batchCourses.findFirst({
      where: and(
        eq(batchCourses.batchId, activeBatch.id),
        eq(batchCourses.courseId, courseId)
      ),
    })

    if (!batchCourse) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "This course is not available in the current batch" } },
        { status: 404 }
      )
    }

    const existing = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.studentId, payload.userId),
        eq(enrollments.courseId, courseId)
      ),
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Already enrolled in this course" } },
        { status: 400 }
      )
    }

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        category: true,
      },
    })

    if (!course || course.status !== "published") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Course not available" } },
        { status: 404 }
      )
    }

    const studentBatchEnrollments = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.studentId, payload.userId),
        eq(enrollments.batchId, activeBatch.id)
      ),
      with: {
        course: {
          with: {
            category: true,
          },
        },
      },
    })

    const currentCount = studentBatchEnrollments.length
    const maxCourses = activeBatch.maxCoursesPerStudent
    const hasFreelancing = studentBatchEnrollments.some((e: any) => 
      e.course?.category?.slug === FREELANCING_SLUG
    )
    const isFreelancing = course.category?.slug === FREELANCING_SLUG

    // Check max courses limit
    if (currentCount >= maxCourses) {
      return NextResponse.json(
        { success: false, error: { code: "LIMIT_REACHED", message: `You can only enroll in ${maxCourses} courses per batch. Your batch is full (${currentCount}/${maxCourses}).` } },
        { status: 400 }
      )
    }

    // ✅ FIXED: Proper freelancing logic
    // Rules: Max 3 courses total, 1 Freelancing compulsory, 2 student choice
    if (activeBatch.freelancingCompulsory && !isFreelancing) {
      // Count non-freelancing courses AFTER this enrollment
      const currentNonFreelancingCount = studentBatchEnrollments.filter(
        (e: any) => e.course?.category?.slug !== FREELANCING_SLUG
      ).length
      
      // After enrolling this non-freelancing course
      const newNonFreelancingCount = currentNonFreelancingCount + 1

      // If we would have more than 2 non-freelancing and still no freelancing
      if (newNonFreelancingCount > 2 && !hasFreelancing) {
        return NextResponse.json(
          { success: false, error: { code: "FREELANCING_REQUIRED", message: "Freelancing course is compulsory! You can only select 2 courses yourself. Please enroll in Freelancing course to complete your batch." } },
          { status: 400 }
        )
      }
    }

    // Create enrollment with batch ID
    const [enrollment] = await db.insert(enrollments).values({
      studentId: payload.userId,
      courseId,
      batchId: activeBatch.id,
      status: "active",
      progressPercent: 0,
    }).returning()

    // Calculate new stats
    const newCount = currentCount + 1
    const newHasFreelancing = isFreelancing || hasFreelancing
    const isBatchComplete = newCount >= maxCourses && newHasFreelancing

    let batchMessage = "Enrolled successfully!"
    if (isBatchComplete) {
      batchMessage = "🎉 Your batch is now complete! You can start learning all your courses."
    } else if (newCount < maxCourses) {
      const remaining = maxCourses - newCount
      batchMessage = `Enrolled! You can enroll in ${remaining} more course${remaining > 1 ? 's' : ''}.`
      if (activeBatch.freelancingCompulsory && !newHasFreelancing) {
        batchMessage += " Remember: Freelancing is compulsory!"
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        enrollmentId: enrollment.id,
        status: enrollment.status,
        batchId: activeBatch.id,
        batchName: activeBatch.name,
        enrolledCount: newCount,
        maxCourses,
        hasFreelancing: newHasFreelancing,
        isBatchComplete,
      },
      message: batchMessage,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Enrollment error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to enroll" } },
      { status: 500 }
    )
  }
}