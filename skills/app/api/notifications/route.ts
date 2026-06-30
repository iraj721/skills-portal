import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../db"
import { notifications, users } from "../../../db/schema"
import { eq, and, desc } from "drizzle-orm"
import { verifyToken } from "../../../lib/auth"
import { z } from "zod"

const notificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.string().default("general"),
  link: z.string().optional(),
})

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

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, payload.userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    })

    const unreadCount = userNotifications.filter(n => !n.isRead).length

    return NextResponse.json({
      success: true,
      data: {
        notifications: userNotifications,
        unreadCount,
      },
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch notifications" } },
      { status: 500 }
    )
  }
}

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

    if (payload.role !== "admin" && payload.role !== "instructor") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized" } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = notificationSchema.parse(body)

    const [notification] = await db.insert(notifications).values({
      userId: payload.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link || null,
      isRead: false,
    }).returning()

    return NextResponse.json({
      success: true,
      data: notification,
      message: "Notification created",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Create notification error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create notification" } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    const { searchParams } = request.nextUrl
    const notificationId = searchParams.get("id")

    if (!notificationId) {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, payload.userId))

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      })
    }

    const [updated] = await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, payload.userId)
      ))
      .returning()

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Notification marked as read",
    })
  } catch (error) {
    console.error("Update notification error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update notification" } },
      { status: 500 }
    )
  }
}