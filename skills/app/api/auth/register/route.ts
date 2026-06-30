import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { users } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { hashPassword, createToken } from "../../../../lib/auth"
import { rateLimit } from "../../../../lib/rate-limit"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().optional(),
  city: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // === PRODUCTION RATE LIMITING ===
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "unknown"
    
    // Very strict: 3 registrations per IP per hour
    const ipLimit = await rateLimit(`register:ip:${ip}`, 3, 60 * 60)
    
    // Also limit by email to prevent email spam
    const body = await request.clone().json().catch(() => ({}))
    const email = body.email || "unknown"
    const emailLimit = await rateLimit(`register:email:${email.toLowerCase()}`, 2, 60 * 60)

    if (!ipLimit.success || !emailLimit.success) {
      const resetTime = Math.max(ipLimit.resetTime, emailLimit.resetTime)
      const retryAfter = Math.ceil(resetTime - Date.now() / 1000)
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many registration attempts. Please try again later.",
            retryAfter: Math.max(0, retryAfter),
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(0, retryAfter)),
          },
        }
      )
    }
    // ================================

    const { email: regEmail, password, fullName, phone, city } = registerSchema.parse(body)

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, regEmail),
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email already registered" } },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const [newUser] = await db.insert(users).values({
      email: regEmail,
      password: hashedPassword,
      fullName,
      role: "student",
      phone: phone || null,
      city: city || null,
      isActive: true,
    }).returning()

    const token = await createToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      },
      message: "Registration successful",
    }, { status: 201 })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("REGISTER ERROR:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes("max clients")) {
      return NextResponse.json(
        { success: false, error: { code: "DB_ERROR", message: "Database busy, please try again in a moment" } },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error instanceof Error ? error.message : "Something went wrong" } },
      { status: 500 }
    )
  }
}