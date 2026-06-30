// lib/rate-limit.ts
import redis from "./redis"

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - windowSeconds

  try {
    const pipeline = redis.pipeline()
    
    pipeline.zremrangebyscore(key, 0, windowStart)
    pipeline.zcard(key)
    pipeline.zadd(key, now, `${now}-${Math.random()}`)
    pipeline.expire(key, windowSeconds + 1)
    
    const results = await pipeline.exec()
    
    if (!results) {
      return { success: false, limit: maxRequests, remaining: 0, resetTime: now + windowSeconds }
    }

    const currentCount = (results[1][1] as number) + 1
    
    const resetTime = now + windowSeconds
    const remaining = Math.max(0, maxRequests - currentCount)
    const success = currentCount <= maxRequests

    return {
      success,
      limit: maxRequests,
      remaining,
      resetTime,
      retryAfter: success ? undefined : resetTime - now,
    }
  } catch (error) {
    console.error("Rate limit Redis error:", error)
    // Fail open — allow request if Redis is down
    return { success: true, limit: maxRequests, remaining: 1, resetTime: now + windowSeconds }
  }
}