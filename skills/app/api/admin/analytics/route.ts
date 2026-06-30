import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { users, courses, enrollments, certificates } from "../../../../db/schema"
import { eq, sql } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
export const dynamic = "force-dynamic"

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

    // Verify admin
    const admin = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1)

    if (!admin || admin.length === 0 || admin[0].role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    // Get basic counts
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users)
    const totalCoursesResult = await db.select({ count: sql<number>`count(*)` }).from(courses)
    const totalEnrollmentsResult = await db.select({ count: sql<number>`count(*)` }).from(enrollments)
    const totalCertificatesResult = await db.select({ count: sql<number>`count(*)` }).from(certificates)

    // Get last month counts for growth calculation
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthStr = lastMonth.toISOString()

    const lastMonthUsers = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${lastMonthStr}`)

    const lastMonthCourses = await db.select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(sql`${courses.createdAt} >= ${lastMonthStr}`)

    const lastMonthEnrollments = await db.select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(sql`${enrollments.enrolledAt} >= ${lastMonthStr}`)

    const lastMonthCertificates = await db.select({ count: sql<number>`count(*)` })
      .from(certificates)
      .where(sql`${certificates.issuedAt} >= ${lastMonthStr}`)

    // Calculate growth percentages
    const totalUsers = Number(totalUsersResult[0]?.count || 0)
    const userGrowth = totalUsers > 0 ? Math.round((Number(lastMonthUsers[0]?.count || 0) / totalUsers) * 100) : 0
    const courseGrowth = totalCoursesResult[0]?.count ? Math.round((Number(lastMonthCourses[0]?.count || 0) / Number(totalCoursesResult[0].count)) * 100) : 0
    const enrollmentGrowth = totalEnrollmentsResult[0]?.count ? Math.round((Number(lastMonthEnrollments[0]?.count || 0) / Number(totalEnrollmentsResult[0].count)) * 100) : 0
    const certificateGrowth = totalCertificatesResult[0]?.count ? Math.round((Number(lastMonthCertificates[0]?.count || 0) / Number(totalCertificatesResult[0].count)) * 100) : 0

    // Get monthly enrollments (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const sixMonthsAgoStr = sixMonthsAgo.toISOString()

    const monthlyEnrollments = await db.select({
      month: sql<string>`TO_CHAR(${enrollments.enrolledAt}, 'Mon YYYY')`,
      count: sql<number>`count(*)`,
    })
    .from(enrollments)
    .where(sql`${enrollments.enrolledAt} >= ${sixMonthsAgoStr}`)
    .groupBy(sql`TO_CHAR(${enrollments.enrolledAt}, 'Mon YYYY')`)
    .orderBy(sql`MIN(${enrollments.enrolledAt})`)

    // Get top courses using raw SQL to avoid subquery issues
    const topCoursesRaw = await db.execute(sql`
      SELECT 
        c.id,
        c.title,
        COALESCE((SELECT count(*) FROM enrollments e WHERE e.course_id = c.id), 0) as enrollments,
        COALESCE((SELECT AVG(e.progress_percent) FROM enrollments e WHERE e.course_id = c.id), 0) as completion_rate
      FROM courses c
      WHERE c.status = 'published'
      ORDER BY enrollments DESC
      LIMIT 5
    `)

    const topCourses = topCoursesRaw.map((row: any) => ({
      id: row.id,
      title: row.title,
      enrollments: Number(row.enrollments),
      completionRate: Math.round(Number(row.completion_rate)),
    }))

    // Get recent activity using SQL-like query builder with joins
    const recentEnrollments = await db
      .select({
        id: enrollments.id,
        enrolledAt: enrollments.enrolledAt,
        status: enrollments.status,
        studentName: users.fullName,
        courseTitle: courses.title,
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.studentId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(sql`${enrollments.enrolledAt} DESC`)
      .limit(5)

    const recentActivity = recentEnrollments.map((e) => ({
      date: e.enrolledAt,
      type: e.status === "completed" ? "completion" : "enrollment",
      user: e.studentName,
      details: e.status === "completed" ? `Completed ${e.courseTitle}` : `Enrolled in ${e.courseTitle}`,
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalCourses: Number(totalCoursesResult[0]?.count || 0),
        totalEnrollments: Number(totalEnrollmentsResult[0]?.count || 0),
        totalCertificates: Number(totalCertificatesResult[0]?.count || 0),
        userGrowth,
        courseGrowth,
        enrollmentGrowth,
        certificateGrowth,
        monthlyEnrollments: monthlyEnrollments.map((m) => ({
          month: m.month,
          count: Number(m.count),
        })),
        topCourses,
        recentActivity,
      },
    })
  } catch (error) {
    console.error("Admin analytics error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch analytics" } },
      { status: 500 }
    )
  }
}