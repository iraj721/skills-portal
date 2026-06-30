import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { users, instructorProfiles } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { z } from "zod"

const profileSchema = z.object({
  expertise: z.array(z.string()).default([]),
  experienceYears: z.number().min(0).optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
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

    // Verify instructor
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!user || (user.role !== "instructor" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Instructor access required" } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = profileSchema.parse(body)

    // Update user profile
    await db.update(users)
      .set({
        bio: data.bio,
        education: data.education,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payload.userId))

    // Update or create instructor profile
    const existingProfile = await db.query.instructorProfiles.findFirst({
      where: eq(instructorProfiles.userId, payload.userId),
    })

    if (existingProfile) {
      await db.update(instructorProfiles)
        .set({
          expertise: data.expertise,
          experienceYears: data.experienceYears,
        })
        .where(eq(instructorProfiles.id, existingProfile.id))
    } else {
      await db.insert(instructorProfiles).values({
        userId: payload.userId,
        expertise: data.expertise,
        experienceYears: data.experienceYears,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Update instructor profile error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update profile" } },
      { status: 500 }
    )
  }
}