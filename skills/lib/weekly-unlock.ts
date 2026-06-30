"use server"

import { db } from "../db"
import { weeklyUnlocks, attendance, enrollments } from "../db/schema"
import { eq, and, count } from "drizzle-orm"

export interface WeekStatus {
  weekNumber: number
  isUnlocked: boolean
  unlockedAt: Date | null
  unlockDeadline: Date | null
  lessonsUnlocked: number
  lessonsCompleted: number
  assignmentCompleted: boolean
  quizCompleted: boolean
  attendanceMarked: boolean
  attendanceStatus: string | null
  isExpired: boolean
  daysRemaining: number
}

export async function getOrCreateWeeklyUnlocks(
  enrollmentId: string,
  courseId: string,
  studentId: string,
  enrolledAt: Date
): Promise<WeekStatus[]> {
  const now = new Date()
  const weeks: WeekStatus[] = []

  for (let weekNum = 1; weekNum <= 8; weekNum++) {
    const unlockDate = new Date(enrolledAt)
    unlockDate.setDate(unlockDate.getDate() + (weekNum - 1) * 7)

    const shouldBeUnlocked = now >= unlockDate

    let weekUnlock = await db.query.weeklyUnlocks.findFirst({
      where: and(
        eq(weeklyUnlocks.enrollmentId, enrollmentId),
        eq(weeklyUnlocks.weekNumber, weekNum)
      ),
    })

    if (!weekUnlock && shouldBeUnlocked) {
      const deadline = new Date(unlockDate)
      deadline.setDate(deadline.getDate() + 7)

      const [created] = await db.insert(weeklyUnlocks).values({
        enrollmentId,
        courseId,
        studentId,
        weekNumber: weekNum,
        unlockedAt: unlockDate,
        unlockDeadline: deadline,
        lessonsUnlocked: 2,
        lessonsCompleted: 0,
        assignmentCompleted: false,
        quizCompleted: false,
        attendanceMarked: false,
      }).returning()

      weekUnlock = created
    }

    let daysRemaining = 0
    let isExpired = false
    if (weekUnlock?.unlockDeadline) {
      const diff = new Date(weekUnlock.unlockDeadline).getTime() - now.getTime()
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24))
      isExpired = daysRemaining < 0
    }

    weeks.push({
      weekNumber: weekNum,
      isUnlocked: shouldBeUnlocked,
      unlockedAt: weekUnlock?.unlockedAt || null,
      unlockDeadline: weekUnlock?.unlockDeadline || null,
      lessonsUnlocked: weekUnlock?.lessonsUnlocked || 2,
      lessonsCompleted: weekUnlock?.lessonsCompleted || 0,
      assignmentCompleted: weekUnlock?.assignmentCompleted || false,
      quizCompleted: weekUnlock?.quizCompleted || false,
      attendanceMarked: weekUnlock?.attendanceMarked || false,
      attendanceStatus: weekUnlock?.attendanceStatus || null,
      isExpired,
      daysRemaining: Math.max(0, daysRemaining),
    })
  }

  return weeks
}

export async function updateWeekLessonCompletion(
  enrollmentId: string,
  weekNumber: number
): Promise<void> {
  const weekUnlock = await db.query.weeklyUnlocks.findFirst({
    where: and(
      eq(weeklyUnlocks.enrollmentId, enrollmentId),
      eq(weeklyUnlocks.weekNumber, weekNumber)
    ),
  })

  if (!weekUnlock) return

  const newCount = (weekUnlock.lessonsCompleted || 0) + 1
  await db.update(weeklyUnlocks)
    .set({ lessonsCompleted: newCount })
    .where(eq(weeklyUnlocks.id, weekUnlock.id))

  await checkAndMarkAttendance(enrollmentId, weekNumber)
}

export async function markWeekAssignmentComplete(
  enrollmentId: string,
  weekNumber: number
): Promise<void> {
  await db.update(weeklyUnlocks)
    .set({ assignmentCompleted: true })
    .where(and(
      eq(weeklyUnlocks.enrollmentId, enrollmentId),
      eq(weeklyUnlocks.weekNumber, weekNumber)
    ))

  await checkAndMarkAttendance(enrollmentId, weekNumber)
}

export async function markWeekQuizComplete(
  enrollmentId: string,
  weekNumber: number
): Promise<void> {
  await db.update(weeklyUnlocks)
    .set({ quizCompleted: true })
    .where(and(
      eq(weeklyUnlocks.enrollmentId, enrollmentId),
      eq(weeklyUnlocks.weekNumber, weekNumber)
    ))

  await checkAndMarkAttendance(enrollmentId, weekNumber)
}

export async function checkAndMarkAttendance(
  enrollmentId: string,
  weekNumber: number
): Promise<{ marked: boolean; status: string }> {
  const weekUnlock = await db.query.weeklyUnlocks.findFirst({
    where: and(
      eq(weeklyUnlocks.enrollmentId, enrollmentId),
      eq(weeklyUnlocks.weekNumber, weekNumber)
    ),
  })

  if (!weekUnlock || weekUnlock.attendanceMarked) {
    return { marked: false, status: weekUnlock?.attendanceStatus || "absent" }
  }

  const lessonsDone = (weekUnlock.lessonsCompleted || 0) >= 2
  const assignmentDone = weekUnlock.assignmentCompleted
  const quizDone = weekUnlock.quizCompleted

  if (lessonsDone && assignmentDone && quizDone) {
    const status = "present"
    
    await db.update(weeklyUnlocks)
      .set({ attendanceMarked: true, attendanceStatus: status })
      .where(eq(weeklyUnlocks.id, weekUnlock.id))

    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
    })

    if (enrollment) {
      await db.insert(attendance).values({
        enrollmentId,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        weekNumber,
        lessonsWatched: weekUnlock.lessonsCompleted,
        totalLessonsRequired: 2,
        assignmentSubmitted: true,
        quizSubmitted: true,
        status,
        markedAt: new Date(),
        notes: "Auto-marked: All weekly requirements completed",
      }).onConflictDoNothing({
        target: [attendance.enrollmentId, attendance.weekNumber],
      })
    }

    return { marked: true, status }
  }

  return { marked: false, status: "absent" }
}

export async function getAttendancePercentage(
  enrollmentId: string
): Promise<number> {
  const totalWeeks = 8
  const presentResult = await db.select({ count: count() }).from(attendance).where(
    and(
      eq(attendance.enrollmentId, enrollmentId),
      eq(attendance.status, "present")
    )
  )
  const presentCount = presentResult[0]?.count ?? 0

  return Math.round((presentCount / totalWeeks) * 100)
}