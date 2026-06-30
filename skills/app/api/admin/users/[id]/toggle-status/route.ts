import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../../db"
import { users } from "../../../../../../db/schema"
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

    if (id === payload.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Cannot deactivate yourself" } },
        { status: 403 }
      )
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      )
    }

    const [updated] = await db.update(users)
      .set({
        isActive: !user.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      data: updated,
      message: `User ${updated.isActive ? "activated" : "deactivated"} successfully`,
    })
  } catch (error) {
    console.error("Toggle status error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to toggle user status" } },
      { status: 500 }
    )
  }
}