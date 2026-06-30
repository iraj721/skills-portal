import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../../db"
import { instructorProfiles, users } from "../../../../../../db/schema"
import { eq } from "drizzle-orm"
import { verifyToken } from "../../../../../../lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    const admin = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    const { id } = await params

    const [updated] = await db.update(instructorProfiles)
      .set({ isVerified: true })
      .where(eq(instructorProfiles.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Instructor not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Instructor verified successfully",
    })
  } catch (error) {
    console.error("Verify instructor error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to verify instructor" } },
      { status: 500 }
    )
  }
}