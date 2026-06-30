import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { users, courses, enrollments, certificates, instructorProfiles } from "../../../../db/schema"
import { eq, sql, and } from "drizzle-orm"
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

    // Verify admin
    const admin = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    // Get stats
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users)
    const totalStudentsResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "student"))
    const totalInstructorsResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "instructor"))
    const totalCoursesResult = await db.select({ count: sql<number>`count(*)` }).from(courses)
    const publishedCoursesResult = await db.select({ count: sql<number>`count(*)` }).from(courses).where(eq(courses.status, "published"))
    const pendingCoursesResult = await db.select({ count: sql<number>`count(*)` }).from(courses).where(eq(courses.status, "pending"))
    const totalEnrollmentsResult = await db.select({ count: sql<number>`count(*)` }).from(enrollments)
    const totalCertificatesResult = await db.select({ count: sql<number>`count(*)` }).from(certificates)

    // Get pending courses
    const pendingCourses = await db.query.courses.findMany({
      where: eq(courses.status, "pending"),
      with: {
        instructor: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: (courses, { desc }) => [desc(courses.createdAt)],
      limit: 5,
    })

    // Get pending instructors (not verified)
    const pendingInstructors = await db.query.instructorProfiles.findMany({
      where: eq(instructorProfiles.isVerified, false),
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      limit: 5,
    })

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers: Number(totalUsersResult[0]?.count || 0),
          totalStudents: Number(totalStudentsResult[0]?.count || 0),
          totalInstructors: Number(totalInstructorsResult[0]?.count || 0),
          totalCourses: Number(totalCoursesResult[0]?.count || 0),
          publishedCourses: Number(publishedCoursesResult[0]?.count || 0),
          pendingCourses: Number(pendingCoursesResult[0]?.count || 0),
          totalEnrollments: Number(totalEnrollmentsResult[0]?.count || 0),
          totalCertificates: Number(totalCertificatesResult[0]?.count || 0),
        },
        pendingItems: {
          courses: pendingCourses,
          instructors: pendingInstructors,
        },
      },
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch dashboard data" } },
      { status: 500 }
    )
  }
}