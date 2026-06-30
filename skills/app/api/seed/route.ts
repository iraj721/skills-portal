import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../db"
import { categories, users, courses, modules, lessons } from "../../../db/schema"
import { eq } from "drizzle-orm"  // FIXED: eq add kiya
import { hashPassword } from "../../../lib/auth"
export const dynamic = "force-dynamic"

// This is a development-only endpoint to seed initial data
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Seeding not allowed in production" } },
        { status: 403 }
      )
    }

    // Seed categories
    const categoryData = [
      { name: "Digital Marketing", slug: "digital-marketing", description: "Learn online marketing strategies", icon: "📈" },
      { name: "Graphic Design", slug: "graphic-design", description: "Master visual design skills", icon: "🎨" },
      { name: "Web Development", slug: "web-development", description: "Build modern websites and apps", icon: "💻" },
      { name: "Freelancing", slug: "freelancing", description: "Start your freelance career", icon: "💼" },
      { name: "E-Commerce", slug: "e-commerce", description: "Launch online businesses", icon: "🛒" },
      { name: "AI & Productivity", slug: "ai-productivity", description: "Leverage AI tools", icon: "🤖" },
    ]

    for (const cat of categoryData) {
      const existing = await db.query.categories.findFirst({
        where: eq(categories.slug, cat.slug),
      })
      if (!existing) {
        await db.insert(categories).values(cat)
      }
    }

    // Seed admin user
    const adminEmail = "admin@naujawanskills.pk"
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    })

    if (!existingAdmin) {
      const hashedPassword = await hashPassword("admin123")
      await db.insert(users).values({
        email: adminEmail,
        password: hashedPassword,
        fullName: "Super Admin",
        role: "admin",
        isActive: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to seed database" } },
      { status: 500 }
    )
  }
}