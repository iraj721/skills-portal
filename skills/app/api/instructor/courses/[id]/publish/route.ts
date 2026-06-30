import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../../db"
import { courses } from "../../../../../../db/schema"
import { eq, and } from "drizzle-orm"
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
    const { id } = await params

    // Verify course belongs to instructor
    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.id, id),
        eq(courses.instructorId, payload.userId)
      ),
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Course not found" } },
        { status: 404 }
      )
    }

    if (course.status !== "draft") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Course is not in draft status" } },
        { status: 400 }
      )
    }

    // Submit for review (admin will approve)
    const [updated] = await db.update(courses)
      .set({
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Course submitted for review",
    })
  } catch (error) {
    console.error("Publish course error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to publish course" } },
      { status: 500 }
    )
  }
}