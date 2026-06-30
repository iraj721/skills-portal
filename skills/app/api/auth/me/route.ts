import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { users } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { rateLimit } from "../../../../lib/rate-limit"
import redis from "../../../../lib/redis"

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "unknown"

    const token = request.cookies.get("token")?.value
    let userIdentifier = ""
    if (token) {
      try {
        const payload = await verifyToken(token)
        userIdentifier = `user:${payload.userId}`
      } catch {
        // Invalid token
      }
    }

    const ipLimit = await rateLimit(`me:ip:${ip}`, 60, 60)

    let userLimit = { success: true, limit: 120, remaining: 120, resetTime: 0 }
    if (userIdentifier) {
      userLimit = await rateLimit(`me:${userIdentifier}`, 120, 60)
    }

    if (!ipLimit.success || !userLimit.success) {
      const resetTime = Math.max(ipLimit.resetTime, userLimit.resetTime)
      const retryAfter = Math.ceil(resetTime - Date.now() / 1000)

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please slow down.",
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

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      )
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        city: user.city,
        education: user.education,
        bio: user.bio,
      },
    })

    response.headers.set("X-RateLimit-Limit", String(ipLimit.limit))
    response.headers.set("X-RateLimit-Remaining", String(Math.min(ipLimit.remaining, userLimit.remaining)))
    response.headers.set("X-RateLimit-Reset", String(ipLimit.resetTime))

    return response
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_001", message: "Invalid token" } },
      { status: 401 }
    )
  }
}