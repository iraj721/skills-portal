import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../db"
import { categories } from "../../../db/schema"
import { eq, sql } from "drizzle-orm"
import { verifyToken } from "../../../lib/auth"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(), // Using icon field in DB for thumbnail
})

// GET /api/categories - Public
export async function GET(request: NextRequest) {
  try {
    const allCategories = await db.select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      slug: categories.slug,
      icon: categories.icon, // Will be used as thumbnail
      createdAt: categories.createdAt,
      courseCount: sql<number>`COALESCE((SELECT count(*) FROM courses WHERE courses.category_id = ${categories.id}), 0)`,
    })
    .from(categories)
    .orderBy(categories.name)

    return NextResponse.json({
      success: true,
      data: allCategories,
    })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch categories" } },
      { status: 500 }
    )
  }
}

// POST /api/categories - Protected (instructor/admin)
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
    
    if (payload.role !== "instructor" && payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_002", message: "Unauthorized" } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = categorySchema.parse(body)

    // Check if category name already exists
    const existing = await db.query.categories.findFirst({
      where: eq(categories.name, data.name),
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Category already exists" } },
        { status: 400 }
      )
    }

    // Generate slug
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    const [category] = await db.insert(categories).values({
      name: data.name,
      slug,
      description: data.description,
      icon: data.thumbnailUrl || null, // Store thumbnail in icon field
    }).returning()

    return NextResponse.json({
      success: true,
      data: category,
      message: "Category created successfully",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Create category error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create category" } },
      { status: 500 }
    )
  }
}