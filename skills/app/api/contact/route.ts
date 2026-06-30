import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "../../../lib/rate-limit"
export const dynamic = "force-dynamic"

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "unknown"

    const limit = await rateLimit(`contact:ip:${ip}`, 3, 60 * 60)

    if (!limit.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many messages. Please try again later.",
            retryAfter: limit.retryAfter,
          },
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const data = contactSchema.parse(body)

    // TODO: Integrate with email service (Resend, SendGrid) or store in DB
    // For now, return success

    return NextResponse.json({
      success: true,
      message: "Message sent successfully. We'll get back to you soon!",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.flatten().fieldErrors } },
        { status: 400 }
      )
    }
    console.error("Contact form error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to send message" } },
      { status: 500 }
    )
  }
}