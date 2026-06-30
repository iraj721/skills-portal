// lib/auth-middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "./rate-limit"

export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options: {
    identifier?: string
    maxRequests: number
    windowSeconds: number
    prefix: string
  }
): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
             request.headers.get("x-real-ip") || 
             "unknown"
  
  const identifier = options.identifier || `${options.prefix}:${ip}`
  
  const limit = await rateLimit(identifier, options.maxRequests, options.windowSeconds)

  if (!limit.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
          retryAfter: limit.retryAfter,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfter),
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(limit.resetTime),
        },
      }
    )
  }

  const response = await handler()

  // Add rate limit headers to successful responses
  response.headers.set("X-RateLimit-Limit", String(limit.limit))
  response.headers.set("X-RateLimit-Remaining", String(limit.remaining))
  response.headers.set("X-RateLimit-Reset", String(limit.resetTime))

  return response
}