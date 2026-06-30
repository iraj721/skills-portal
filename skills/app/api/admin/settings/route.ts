import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { users, settings } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { z } from "zod"

const settingsSchema = z.object({
  siteName: z.string().min(1),
  siteDescription: z.string(),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  enableRegistration: z.boolean(),
  enableCourseCreation: z.boolean(),
  requireApproval: z.boolean(),
  maintenanceMode: z.boolean(),
})

const defaultSettings = {
  siteName: "PNP Platform",
  siteDescription: "",
  contactEmail: "",
  contactPhone: "",
  enableRegistration: true,
  enableCourseCreation: false,
  requireApproval: true,
  maintenanceMode: false,
}

function rowsToObject(rows: { key: string; value: string }[]) {
  const obj: Record<string, any> = { ...defaultSettings }
  for (const row of rows) {
    try {
      obj[row.key] = JSON.parse(row.value)
    } catch {
      obj[row.key] = row.value
    }
  }
  return obj
}

function objectToRows(data: Record<string, any>) {
  return Object.entries(data).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }))
}

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

    const admin = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    const rows = await db.select().from(settings)
    const data = rowsToObject(rows)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Get settings error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch settings" } },
      { status: 500 }
    )
  }
}

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

    const admin = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedSettings = settingsSchema.parse(body)

    const rows = objectToRows(validatedSettings)

    for (const row of rows) {
      await db
        .insert(settings)
        .values(row)
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: row.value, updatedAt: new Date() },
        })
    }

    return NextResponse.json({
      success: true,
      data: validatedSettings,
      message: "Settings saved successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Save settings error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to save settings" } },
      { status: 500 }
    )
  }
}