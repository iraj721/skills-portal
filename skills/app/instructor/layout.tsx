"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Award,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  GraduationCap,
  FolderOpen,
  HelpCircle,
  CalendarCheck,
} from "lucide-react"

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.user.role !== "instructor" && data.user.role !== "admin") {
            router.push("/dashboard")
            return
          }
          setUser(data.user)
        } else {
          router.push("/login")
        }
      })
  }, [router])

  const navItems = [
    { href: "/instructor/instructor-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/instructor/courses", label: "My Courses", icon: BookOpen },
    { href: "/instructor/courses/new", label: "Create Course", icon: GraduationCap },
    { href: "/instructor/categories", label: "Categories", icon: FolderOpen },
    { href: "/instructor/quizzes", label: "Quizzes", icon: HelpCircle },
    { href: "/instructor/students", label: "Students", icon: Users },
    { href: "/instructor/assignments", label: "Assignments", icon: FileText },
    { href: "/instructor/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/instructor/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/instructor/certificates", label: "Certificates", icon: Award },
    { href: "/instructor/settings", label: "Settings", icon: Settings },
  ]

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform`}>
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0B6623] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PNP</span>
            </div>
            <div>
              <span className="font-bold text-lg block leading-tight">Instructor</span>
              <span className="text-xs text-gray-500">Panel</span>
            </div>
          </div>
        </div>

        {/* Nav - FIX: flex-1 overflow-auto added */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${isActive ? "bg-[#0B6623]/10 text-[#0B6623]" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer - FIX: flex-shrink-0 added, absolute hata diya */}
        <div className="p-4 border-t flex-shrink-0 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
              {user.fullName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 text-sm font-medium w-full px-3 py-2 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold">Instructor Panel</span>
          <div className="w-8" />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}