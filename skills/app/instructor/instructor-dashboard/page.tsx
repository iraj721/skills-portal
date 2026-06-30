"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Users, FileText, TrendingUp, ArrowRight, Eye, Plus } from "lucide-react"

export default function InstructorDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    avgCompletion: 0,
  })
  const [recentCourses, setRecentCourses] = useState<any[]>([])
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/instructor/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data.stats)
          setRecentCourses(data.data.recentCourses)
          setRecentStudents(data.data.recentStudents)
        }
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-10 mb-3" />
              <div className="h-6 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-24" />
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
          <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-500">Welcome back! Manage your courses and students.</p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="flex items-center gap-2 bg-[#0B6623] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "My Courses", value: stats.totalCourses, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
          { label: "Total Students", value: stats.totalStudents, icon: Users, color: "bg-green-50 text-green-600" },
          { label: "Assignments", value: stats.totalAssignments, icon: FileText, color: "bg-yellow-50 text-yellow-600" },
          { label: "Avg Completion", value: `${stats.avgCompletion}%`, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">My Courses</h2>
            <Link href="/instructor/courses" className="text-[#0B6623] text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {recentCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No courses yet</p>
                <Link href="/instructor/courses/new" className="text-[#0B6623] font-medium mt-2 inline-block">
                  Create your first course
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-16 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {course.thumbnailUrl && (
                        <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{course.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="capitalize">{course.status}</span>
                        <span>{course.totalStudents || 0} students</span>
                      </div>
                    </div>
                    <Link
                      href={`/instructor/courses/${course.id}`}
                      className="text-[#0B6623] hover:bg-[#0B6623]/10 p-2 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Recent Students</h2>
            <Link href="/instructor/students" className="text-[#0B6623] text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {recentStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No students enrolled yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {student.student?.fullName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{student.student?.fullName}</h3>
                      <p className="text-xs text-gray-500">{student.course?.title}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {student.progressPercent}% done
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}