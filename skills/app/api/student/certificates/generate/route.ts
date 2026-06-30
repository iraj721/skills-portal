import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../db"
import { certificates, enrollments } from "../../../../../db/schema"
import { eq, and } from "drizzle-orm"
import { verifyToken } from "../../../../../lib/auth"
import { generateCertificateNumber } from "../../../../../lib/utils"
import { z } from "zod"

const generateSchema = z.object({
  enrollmentId: z.string().uuid("Invalid enrollment ID"),
})

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
    const { enrollmentId } = generateSchema.parse(body)

    // Verify enrollment exists and is completed
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.id, enrollmentId),
        eq(enrollments.studentId, payload.userId)
      ),
      with: {
        course: true,
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Enrollment not found" } },
        { status: 404 }
      )
    }

    if (enrollment.status !== "completed") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Course not completed yet" } },
        { status: 403 }
      )
    }

    // Check if certificate already exists
    const existing = await db.query.certificates.findFirst({
      where: eq(certificates.enrollmentId, enrollmentId),
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: "Certificate already exists",
      })
    }

    // Generate certificate
    const certificateNumber = generateCertificateNumber()

    const [certificate] = await db.insert(certificates).values({
      enrollmentId,
      studentId: payload.userId,
      courseId: enrollment.courseId,
      certificateNumber,
      pdfUrl: null, // Will be generated later
    }).returning()

    return NextResponse.json({
      success: true,
      data: certificate,
      message: "Certificate generated successfully",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Generate certificate error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to generate certificate" } },
      { status: 500 }
    )
  }
}