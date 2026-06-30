import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { batches, enrollments } from "../../../../db/schema"
import { eq, and, sql } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"

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
    const now = new Date()

    // Get current active batch
    const activeBatch = await db.query.batches.findFirst({
      where: and(
        eq(batches.status, "open"),
        sql`${batches.enrollmentOpenDate} <= ${now}`,
        sql`${batches.enrollmentCloseDate} >= ${now}`
      ),
    })

    if (!activeBatch) {
      // Check upcoming
      const upcoming = await db.query.batches.findFirst({
        where: eq(batches.status, "upcoming"),
        orderBy: (batches, { asc }) => [asc(batches.enrollmentOpenDate)],
      })

      return NextResponse.json({
        success: true,
        data: {
          isEnrollmentOpen: false,
          currentBatch: null,
          upcomingBatch: upcoming ? {
            id: upcoming.id,
            name: upcoming.name,
            batchNumber: upcoming.batchNumber,
            opensAt: upcoming.enrollmentOpenDate,
          } : null,
          message: upcoming 
            ? `Next batch "${upcoming.name}" opens on ${new Date(upcoming.enrollmentOpenDate).toLocaleDateString()}`
            : "No upcoming batches scheduled",
        },
      })
    }

    // Get student's enrollment in this batch
    const studentEnrollments = await db.query.enrollments.findMany({
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

    const enrolledCount = studentEnrollments.length
    const hasFreelancing = studentEnrollments.some((e: any) => 
      e.course?.category?.slug === "freelancing"
    )
    const isBatchComplete = enrolledCount >= activeBatch.maxCoursesPerStudent && 
      (!activeBatch.freelancingCompulsory || hasFreelancing)

    return NextResponse.json({
      success: true,
      data: {
        isEnrollmentOpen: true,
        currentBatch: {
          id: activeBatch.id,
          name: activeBatch.name,
          batchNumber: activeBatch.batchNumber,
          maxCourses: activeBatch.maxCoursesPerStudent,
          freelancingCompulsory: activeBatch.freelancingCompulsory,
          enrollmentDeadline: activeBatch.enrollmentCloseDate,
        },
        studentStats: {
          enrolledCount,
          hasFreelancing,
          isBatchComplete,
          remainingCourses: activeBatch.maxCoursesPerStudent - enrolledCount,
        },
      },
    })
  } catch (error) {
    console.error("Batch status error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to check batch status" } },
      { status: 500 }
    )
  }
}