import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { users } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { z } from "zod"
export const dynamic = "force-dynamic"

const profileSchema = z.object({
  fullName: z.string().min(2, "Name is required").optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  education: z.string().optional(),
  bio: z.string().optional(),
})

export async function PUT(request: NextRequest) {
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
    const updates = profileSchema.parse(body)

    const [updated] = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payload.userId))
      .returning()

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        city: updated.city,
        education: updated.education,
        bio: updated.bio,
        role: updated.role,
      },
      message: "Profile updated successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Update profile error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update profile" } },
      { status: 500 }
    )
  }
}