import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { certificates, users, courses, enrollments } from "../../../../db/schema"
import { eq, desc } from "drizzle-orm"
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

    // Only select columns that exist in schema
    const allCertificates = await db
      .select({
        id: certificates.id,
        enrollmentId: certificates.enrollmentId,
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        studentId: users.id,
        studentFullName: users.fullName,
        studentEmail: users.email,
        courseId: courses.id,
        courseTitle: courses.title,
        enrollmentStatus: enrollments.status,
        enrollmentProgress: enrollments.progressPercent,
      })
      .from(certificates)
      .leftJoin(enrollments, eq(certificates.enrollmentId, enrollments.id))
      .leftJoin(users, eq(enrollments.studentId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(desc(certificates.issuedAt))

    // Transform to match expected response shape
    const formattedCertificates = allCertificates.map((cert) => ({
      id: cert.id,
      enrollmentId: cert.enrollmentId,
      certificateNumber: cert.certificateNumber,
      issuedAt: cert.issuedAt,
      student: cert.studentId ? {
        id: cert.studentId,
        fullName: cert.studentFullName,
        email: cert.studentEmail,
      } : null,
      course: cert.courseId ? {
        id: cert.courseId,
        title: cert.courseTitle,
      } : null,
      enrollment: cert.enrollmentId ? {
        id: cert.enrollmentId,
        status: cert.enrollmentStatus,
        progressPercent: cert.enrollmentProgress,
      } : null,
    }))

    return NextResponse.json({
      success: true,
      data: formattedCertificates,
    })
  } catch (error) {
    console.error("Get certificates error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch certificates" } },
      { status: 500 }
    )
  }
}