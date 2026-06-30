import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { certificates } from "../../../../db/schema"
import { eq } from "drizzle-orm"
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

    const userCertificates = await db.query.certificates.findMany({
      where: eq(certificates.studentId, payload.userId),
      with: {
        course: {
          columns: {
            id: true,
            title: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: (certificates, { desc }) => [desc(certificates.issuedAt)],
    })

    return NextResponse.json({
      success: true,
      data: userCertificates,
    })
  } catch (error) {
    console.error("Get certificates error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch certificates" } },
      { status: 500 }
    )
  }
}