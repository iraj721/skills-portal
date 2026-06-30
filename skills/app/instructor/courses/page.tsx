"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Plus, Eye, Edit, Users, Clock, AlertCircle, FolderOpen } from "lucide-react"

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/instructor/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCourses(data.data)
        setLoading(false)
      })
  }, [])

  const getStatusColor = (status: string) => {
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500">Manage all your courses</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/instructor/categories"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            <FolderOpen className="w-4 h-4" />
            Categories
          </Link>
          <Link
            href="/instructor/courses/new"
            className="flex items-center gap-2 bg-[#0B6623] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-6">Start creating courses to share your knowledge</p>
          <Link
            href="/instructor/courses/new"
            className="inline-flex items-center gap-2 bg-[#0B6623] text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90"
          >
            <Plus className="w-4 h-4" />
            Create First Course
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gray-100 relative">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <div className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(course.status)}`}>
                  {course.status}
                </div>
                {course.category && (
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {course.category.name}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.shortDescription}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {course.totalStudents || 0} students
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.durationHours}h
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/instructor/courses/${course.id}`}
                    className="flex-1 flex items-center justify-center gap-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Link>
                  <Link
                    href={`/instructor/courses/${course.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1 bg-[#0B6623] text-white py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}