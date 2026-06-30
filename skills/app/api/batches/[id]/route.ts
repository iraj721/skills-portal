import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { batches } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"

// GET single batch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    await verifyToken(token)
    const { id } = await params

    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, id),
      with: {
        batchCourses: {
          with: {
            course: {
              with: {
                category: true,
                instructor: true,
              },
            },
          },
        },
        enrollments: true,
      },
    })

    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Batch not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: batch,
    })
  } catch (error) {
    console.error("Get batch error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch batch" } },
      { status: 500 }
    )
  }
}

// PUT - Update batch status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_002", message: "Unauthorized" } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    const [updated] = await db.update(batches)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Batch updated successfully",
    })
  } catch (error) {
    console.error("Update batch error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update batch" } },
      { status: 500 }
    )
  }
}

// DELETE batch (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_002", message: "Unauthorized" } },
        { status: 403 }
      )
    }

    const { id } = await params

    await db.delete(batches).where(eq(batches.id, id))

    return NextResponse.json({
      success: true,
      message: "Batch deleted successfully",
    })
  } catch (error) {
    console.error("Delete batch error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete batch" } },
      { status: 500 }
    )
  }
}