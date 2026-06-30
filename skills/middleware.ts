import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicRoutes = ["/", "/login", "/register"]
  const publicApiRoutes = ["/api/auth/login", "/api/auth/register"]

  if (publicRoutes.includes(pathname) || publicApiRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get("token")?.value

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Authentication required" } },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const payload = await verifyToken(token)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", payload.userId)
    requestHeaders.set("x-user-role", payload.role)

    // Role-based access control
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    if (pathname.startsWith("/instructor") && payload.role !== "instructor" && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Redirect instructors to instructor dashboard
    if (pathname === "/dashboard" && payload.role === "instructor") {
      return NextResponse.redirect(new URL("/instructor/instructor-dashboard", request.url))
    }

    // Redirect admins to admin dashboard
    if (pathname === "/dashboard" && payload.role === "admin") {
      return NextResponse.redirect(new URL("/admin/admin-dashboard", request.url))
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_001", message: "Invalid token" } },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}