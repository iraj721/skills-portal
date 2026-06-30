import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { attendance, enrollments, courses, users, weeklyUnlocks } from "../../../../db/schema"
import { eq, and, sql, inArray } from "drizzle-orm"
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
    const { searchParams } = request.nextUrl
    const courseId = searchParams.get("courseId")
    const weekNumber = searchParams.get("weekNumber")

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Course ID required" } },
        { status: 400 }
      )
    }

    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.id, courseId),
        eq(courses.instructorId, payload.userId)
      ),
    })

    if (!course && payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not your course" } },
        { status: 403 }
      )
    }

    const courseEnrollments = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.status, "active")
      ),
      with: {
        student: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    const enrollmentIds = courseEnrollments.map(e => e.id)

    if (enrollmentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    let attendanceRecords

    if (weekNumber) {
      attendanceRecords = await db.query.attendance.findMany({
        where: and(
          eq(attendance.courseId, courseId),
          eq(attendance.weekNumber, parseInt(weekNumber)),
          inArray(attendance.enrollmentId, enrollmentIds)
        ),
        with: {
          student: {
            columns: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      })
    } else {
      attendanceRecords = await db.query.attendance.findMany({
        where: and(
          eq(attendance.courseId, courseId),
          inArray(attendance.enrollmentId, enrollmentIds)
        ),
        with: {
          student: {
            columns: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [sql`${attendance.weekNumber} ASC`],
      })
    }

    const studentMap = new Map()

    for (const record of attendanceRecords) {
      const studentId = record.studentId
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          enrollmentId: record.enrollmentId,
          student: record.student,
          weeks: [],
          totalPresent: 0,
          totalAbsent: 0,
          attendancePercentage: 0,
        })
      }

      const studentData = studentMap.get(studentId)
      studentData.weeks.push({
        weekNumber: record.weekNumber,
        status: record.status,
        lessonsWatched: record.lessonsWatched,
        assignmentSubmitted: record.assignmentSubmitted,
        quizSubmitted: record.quizSubmitted,
        markedAt: record.markedAt,
      })

      if (record.status === "present") {
        studentData.totalPresent++
      } else {
        studentData.totalAbsent++
      }
    }

    for (const [, data] of studentMap) {
      const total = data.totalPresent + data.totalAbsent
      data.attendancePercentage = total > 0 ? Math.round((data.totalPresent / total) * 100) : 0
    }

    return NextResponse.json({
      success: true,
      data: Array.from(studentMap.values()),
    })
  } catch (error) {
    console.error("Get instructor attendance error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch attendance" } },
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
    const { enrollmentId, weekNumber, status, notes } = body

    if (!enrollmentId || !weekNumber || !status) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      )
    }

    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
      with: {
        course: {
          columns: { instructorId: true },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Enrollment not found" } },
        { status: 404 }
      )
    }

    const isOwner = enrollment.course?.instructorId === payload.userId
    const isAdmin = payload.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized" } },
        { status: 403 }
      )
    }

    const existing = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.enrollmentId, enrollmentId),
        eq(attendance.weekNumber, weekNumber)
      ),
    })

    if (existing) {
      await db.update(attendance)
        .set({
          status,
          markedBy: payload.userId,
          markedAt: new Date(),
          notes: notes || existing.notes,
        })
        .where(eq(attendance.id, existing.id))
    } else {
      await db.insert(attendance).values({
        enrollmentId,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        weekNumber,
        status,
        markedBy: payload.userId,
        markedAt: new Date(),
        notes: notes || "Manually marked by instructor",
      })
    }

    const weekUnlock = await db.query.weeklyUnlocks.findFirst({
      where: and(
        eq(weeklyUnlocks.enrollmentId, enrollmentId),
        eq(weeklyUnlocks.weekNumber, weekNumber)
      ),
    })

    if (weekUnlock) {
      await db.update(weeklyUnlocks)
        .set({
          attendanceMarked: true,
          attendanceStatus: status,
        })
        .where(eq(weeklyUnlocks.id, weekUnlock.id))
    }

    return NextResponse.json({
      success: true,
      message: `Attendance marked as ${status}`,
    })
  } catch (error) {
    console.error("Mark attendance error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to mark attendance" } },
      { status: 500 }
    )
  }
}