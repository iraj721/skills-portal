"use client"

import { useEffect, useState } from "react"
import { BarChart3, Users, BookOpen, TrendingUp, Award, Clock } from "lucide-react"

export default function InstructorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/instructor/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAnalytics(data.data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
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

  if (!analytics) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">No analytics available</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">Track your course performance</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: analytics.totalStudents, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Total Courses", value: analytics.totalCourses, icon: BookOpen, color: "bg-green-50 text-green-600" },
          { label: "Avg Completion", value: `${analytics.avgCompletion}%`, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
          { label: "Certificates", value: analytics.totalCertificates, icon: Award, color: "bg-yellow-50 text-yellow-600" },
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

      {/* Course Performance */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Course Performance</h2>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Students</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Avg Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analytics.courses?.map((course: any) => (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-gray-900">{course.title}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{course.totalStudents}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#0B6623] h-2 rounded-full"
                            style={{ width: `${course.avgProgress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{course.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{course.completedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Enrollments Chart Placeholder */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Monthly Enrollments</h2>
        <div className="h-64 flex items-end justify-between gap-2">
          {analytics.monthlyEnrollments?.map((month: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-[#0B6623]/20 rounded-t-lg hover:bg-[#0B6623]/40 transition-colors relative group"
                style={{ height: `${(month.count / Math.max(...analytics.monthlyEnrollments.map((m: any) => m.count))) * 200}px` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {month.count} students
                </div>
              </div>
              <span className="text-xs text-gray-500">{month.month}</span>
            </div>
          )) || (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <BarChart3 className="w-12 h-12 mr-2" />
              <span>No data available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}