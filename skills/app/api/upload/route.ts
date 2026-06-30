import { NextRequest, NextResponse } from "next/server"
import { uploadToStorage, deleteFromStorage } from "../../../lib/storage"
import { extractYouTubeVideoId, getYouTubeVideoInfo } from "../../../lib/youtube"
import { verifyToken } from "../../../lib/auth"
import { randomUUID } from "crypto"
import { rateLimit } from "../../../lib/rate-limit"
export const dynamic = "force-dynamic"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/mov"]

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const MAX_VIDEO_SIZE = 500 * 1024 * 1024

type UploadType = "image" | "video" | "youtube" | "thumbnail"

interface UploadResult {
  url: string
  filename?: string
  videoId?: string
  size?: number
  type: string
  provider: "supabase" | "youtube"
  metadata?: {
    title?: string
    thumbnailUrl?: string
    duration?: string
    channelTitle?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // === REDIS RATE LIMITING ===
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "unknown"
    
    const limit = await rateLimit(`upload:ip:${ip}`, 10, 60)
    
    if (!limit.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many uploads. Please try again later.",
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
          }
        }
      )
    }

    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)

    const formData = await request.formData()
    const uploadType = (formData.get("type") as UploadType) || "image"
    const folder = (formData.get("folder") as string) || "uploads"

    // ========== YOUTUBE URL ==========
    if (uploadType === "youtube") {
      const youtubeUrl = formData.get("youtubeUrl") as string
      
      if (!youtubeUrl) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "YouTube URL is required" } },
          { status: 400 }
        )
      }

      const videoId = extractYouTubeVideoId(youtubeUrl)
      if (!videoId) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid YouTube URL" } },
          { status: 400 }
        )
      }

      const videoInfo = await getYouTubeVideoInfo(videoId)

      return NextResponse.json({
        success: true,
        data: {
          url: youtubeUrl,
          videoId,
          type: "youtube",
          provider: "youtube",
          metadata: videoInfo || undefined,
        } satisfies UploadResult,
      })
    }

    // ========== FILE UPLOAD ==========
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "No file provided" } },
        { status: 400 }
      )
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid file type" } },
        { status: 400 }
      )
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Image size must be less than 2MB" } },
        { status: 400 }
      )
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Video size must be less than 500MB" } },
        { status: 400 }
      )
    }

    const ext = file.name.split(".").pop()?.toLowerCase()
    const uniqueId = randomUUID()
    const filename = `${uniqueId}.${ext}`
    const path = `${folder}/${payload.userId}/${filename}`

    const bytes = await file.arrayBuffer()
    const fileUrl = await uploadToStorage(path, Buffer.from(bytes), file.type)

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        filename,
        size: file.size,
        type: file.type,
        provider: "supabase",
      } satisfies UploadResult,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to upload file" } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    await verifyToken(token)

    const { searchParams } = request.nextUrl
    const path = searchParams.get("key")

    if (!path) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "File path is required" } },
        { status: 400 }
      )
    }

    await deleteFromStorage(path)

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete file" } },
      { status: 500 }
    )
  }
}