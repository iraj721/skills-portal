import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { users } from "../../../../db/schema"
import { eq, or } from "drizzle-orm"
import { verifyPassword, createToken } from "../../../../lib/auth"
import { rateLimit } from "../../../../lib/rate-limit"
import redis from "../../../../lib/redis"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    // === PRODUCTION RATE LIMITING ===
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "unknown"

    // Stricter limit for failed attempts per email
    const body = await request.clone().json().catch(() => ({}))
    const email = body.email || "unknown"

    // IP-based limit: 10 attempts per 15 minutes
    const ipLimit = await rateLimit(`login:ip:${ip}`, 10, 15 * 60)

    // Email-based limit: 5 attempts per 15 minutes
    // FIX: Use email+ip combo to prevent genuine users from being blocked by shared IPs
    const emailKey = email !== "unknown" ? `login:email:${email.toLowerCase()}` : `login:ip-email:${ip}`
    const emailLimit = await rateLimit(emailKey, 5, 15 * 60)

    if (!ipLimit.success || !emailLimit.success) {
      const resetTime = Math.max(ipLimit.resetTime, emailLimit.resetTime)
      const retryAfter = Math.ceil(resetTime - Date.now() / 1000)

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many login attempts. Please try again later.",
            retryAfter: Math.max(0, retryAfter),
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(0, retryAfter)),
            "X-RateLimit-Limit": String(ipLimit.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(resetTime),
          },
        }
      )
    }
    // ================================

    const { email: loginEmail, password } = loginSchema.parse(body)

    const user = await db.query.users.findFirst({
      where: or(
        eq(users.email, loginEmail),
        eq(users.username, loginEmail)
      ),
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Invalid email or password" } },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_002", message: "Account is deactivated" } },
        { status: 403 }
      )
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Invalid email or password" } },
        { status: 401 }
      )
    }

    // Clear failed login attempts on success
    await redis.del(`login:ip:${ip}`)
    await redis.del(`login:email:${loginEmail.toLowerCase()}`)

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    let redirectUrl = "/dashboard"
    if (user.role === "instructor") {
      redirectUrl = "/instructor/instructor-dashboard"
    } else if (user.role === "admin") {
      redirectUrl = "/admin/admin-dashboard"
    }

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        redirectUrl,
      },
      message: "Login successful",
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}