import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { certificates, users, courses } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const certificateNumber = searchParams.get("certificateNumber")

    if (!certificateNumber) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Certificate number is required" } },
        { status: 400 }
      )
    }

    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.certificateNumber, certificateNumber),
      with: {
        student: {
          columns: {
            id: true,
            fullName: true,
          },
        },
        course: {
          columns: {
            id: true,
            title: true,
            thumbnailUrl: true,
          },
        },
        enrollment: true,
      },
    })

    if (!certificate || certificate.isRevoked) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Certificate not found or revoked" } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.student?.fullName,
        courseTitle: certificate.course?.title,
        courseThumbnail: certificate.course?.thumbnailUrl,
        issuedAt: certificate.issuedAt,
        isValid: true,
      },
      message: "Certificate verified successfully",
    })
  } catch (error) {
    console.error("Verify certificate error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to verify certificate" } },
      { status: 500 }
    )
  }
}