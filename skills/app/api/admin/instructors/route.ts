import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../db"
import { instructorProfiles, users } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { verifyToken } from "../../../../lib/auth"
import { hashPassword } from "../../../../lib/auth"

// GET - Fetch all instructors
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

    const allInstructors = await db.query.instructorProfiles.findMany({
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            username: true,
            phone: true,
            city: true,
            avatarUrl: true,
            createdAt: true,
            role: true,
          },
        },
        organization: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: (instructorProfiles, { desc }) => [desc(instructorProfiles.createdAt)],
    })

    return NextResponse.json({
      success: true,
      data: allInstructors,
    })
  } catch (error) {
    console.error("Get instructors error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch instructors" } },
      { status: 500 }
    )
  }
}

// POST - Admin creates new instructor with username/password
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
    const { fullName, email, username, password, phone, city, expertise, experienceYears } = body

    // Validation
    if (!fullName || !email || !username || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Full name, email, username and password are required" } },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Password must be at least 6 characters" } },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_EMAIL", message: "Email already exists" } },
        { status: 409 }
      )
    }

    // Check if username already exists
    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, username),
    })

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_USERNAME", message: "Username already exists" } },
        { status: 409 }
      )
    }

    // Hash password using your existing function
    const hashedPassword = await hashPassword(password)

    // Create user with instructor role
    const [newUser] = await db.insert(users).values({
      email,
      username,
      password: hashedPassword,
      fullName,
      role: "instructor",
      phone: phone || null,
      city: city || null,
      isActive: true,
    }).returning()

    // Create instructor profile
    const [newProfile] = await db.insert(instructorProfiles).values({
      userId: newUser.id,
      expertise: expertise || [],
      experienceYears: experienceYears || 0,
      isVerified: true, // Auto-verified since admin creates them
      totalStudents: 0,
      totalCourses: 0,
    }).returning()

    return NextResponse.json({
      success: true,
      data: {
        ...newProfile,
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          username: newUser.username,
          phone: newUser.phone,
          city: newUser.city,
          role: newUser.role,
        },
      },
      message: "Instructor created successfully",
    }, { status: 201 })

  } catch (error) {
    console.error("Create instructor error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create instructor" } },
      { status: 500 }
    )
  }
}