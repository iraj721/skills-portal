"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, BookOpen, CheckCircle, XCircle, Eye, Clock, Filter } from "lucide-react"

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    const res = await fetch("/api/admin/courses")
    const data = await res.json()
    if (data.success) {
      setCourses(data.data)
      setLoading(false)
    }
  }

  async function handleApprove(courseId: string) {
    setActionId(courseId)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/approve`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        setCourses(courses.map((c) => c.id === courseId ? { ...c, status: "published" } : c))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(courseId: string) {
    setActionId(courseId)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/reject`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        setCourses(courses.map((c) => c.id === courseId ? { ...c, status: "draft" } : c))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title?.toLowerCase().includes(search.toLowerCase()) ||
      course.instructor?.fullName?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-700"
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "draft": return "bg-gray-100 text-gray-700"
      case "archived": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Courses Management</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Courses Management</h1>
        <p className="text-gray-500">Review and manage all courses</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses or instructors..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-20 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(course.status)}`}>
                      {course.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">by {course.instructor?.fullName}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.durationHours}h
                    </span>
                    <span className="capitalize">{course.level}</span>
                    <span>{course.language}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/courses/${course.slug}`}
                  target="_blank"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                {course.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(course.id)}
                      disabled={actionId === course.id}
                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(course.id)}
                      disabled={actionId === course.id}
                      className="flex items-center gap-1 border border-red-300 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                {course.status === "published" && (
                  <button
                    onClick={() => handleReject(course.id)}
                    disabled={actionId === course.id}
                    className="flex items-center gap-1 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Unpublish
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}