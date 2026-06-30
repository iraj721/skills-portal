import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { attendance, enrollments, courses } from "../../../../db/schema"
import { eq, and, inArray } from "drizzle-orm"
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

    // Get all active enrollments
    const userEnrollments = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.studentId, payload.userId),
        eq(enrollments.status, "active")
      ),
      with: {
        course: {
          columns: { id: true, title: true },
        },
      },
    })

    if (userEnrollments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    const enrollmentIds = userEnrollments.map(e => e.id)

    // ✅ FIXED: Single query for all attendance records instead of N+1
    const allAttendanceRecords = await db.query.attendance.findMany({
      where: inArray(attendance.enrollmentId, enrollmentIds),
    })

    // Group by enrollment
    const attendanceMap = new Map()
    for (const record of allAttendanceRecords) {
      if (!attendanceMap.has(record.enrollmentId)) {
        attendanceMap.set(record.enrollmentId, [])
      }
      attendanceMap.get(record.enrollmentId).push(record)
    }

    const result = []

    for (const enrollment of userEnrollments) {
      const weeks = []
      let presentCount = 0
      const records = attendanceMap.get(enrollment.id) || []

      // Create a map for quick lookup
      const recordMap = new Map()
      for (const r of records) {
        recordMap.set(r.weekNumber, r)
      }

      for (let weekNum = 1; weekNum <= 8; weekNum++) {
        const record = recordMap.get(weekNum)

        weeks.push({
          weekNumber: weekNum,
          status: record?.status || "pending",
          lessonsWatched: record?.lessonsWatched || 0,
          assignmentSubmitted: record?.assignmentSubmitted || false,
          quizSubmitted: record?.quizSubmitted || false,
        })

        if (record?.status === "present") presentCount++
      }

      result.push({
        courseId: enrollment.courseId,
        courseTitle: enrollment.course?.title,
        presentWeeks: presentCount,
        attendancePercentage: Math.round((presentCount / 8) * 100),
        weeks,
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Get student attendance error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch attendance" } },
      { status: 500 }
    )
  }
}