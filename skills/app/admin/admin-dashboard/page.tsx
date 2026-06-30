"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, BookOpen, GraduationCap, Award, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowRight } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    publishedCourses: 0,
    pendingCourses: 0,
    totalEnrollments: 0,
    totalCertificates: 0,
  })
  const [pendingItems, setPendingItems] = useState({
    courses: [],
    instructors: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/admin-dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data.stats)
          setPendingItems(data.data.pendingItems)
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-50 text-blue-600", sub: `${stats.totalStudents} students, ${stats.totalInstructors} instructors` },
          { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, color: "bg-green-50 text-green-600", sub: `${stats.publishedCourses} published, ${stats.pendingCourses} pending` },
          { label: "Total Enrollments", value: stats.totalEnrollments, icon: TrendingUp, color: "bg-purple-50 text-purple-600", sub: "Active learning" },
          { label: "Certificates Issued", value: stats.totalCertificates, icon: Award, color: "bg-yellow-50 text-yellow-600", sub: "Completed courses" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm font-medium text-gray-900">{stat.label}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Courses */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold">Pending Courses ({pendingItems.courses.length})</h2>
            </div>
            <Link href="/admin/courses" className="text-[#0B6623] text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {pendingItems.courses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p>No pending courses</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingItems.courses.slice(0, 5).map((course: any) => (
                  <div key={course.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {course.thumbnailUrl && (
                        <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{course.title}</h3>
                      <p className="text-xs text-gray-500">by {course.instructor?.fullName}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Instructors */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold">Pending Instructors ({pendingItems.instructors.length})</h2>
            </div>
            <Link href="/admin/instructors" className="text-[#0B6623] text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {pendingItems.instructors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p>No pending instructors</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingItems.instructors.slice(0, 5).map((instructor: any) => (
                  <div key={instructor.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {instructor.fullName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{instructor.fullName}</h3>
                      <p className="text-xs text-gray-500">{instructor.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Platform Activity</h2>
        </div>
        <div className="p-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-900">{stats.totalStudents}</p>
              <p className="text-sm text-blue-600">Active Students</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-900">{stats.publishedCourses}</p>
              <p className="text-sm text-green-600">Live Courses</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Award className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-900">{stats.totalCertificates}</p>
              <p className="text-sm text-purple-600">Certificates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}