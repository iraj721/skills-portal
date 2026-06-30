"use client"

import { useEffect, useState } from "react"
import { Users, BookOpen, TrendingUp, Award, BarChart3, Calendar, ArrowUp, ArrowDown } from "lucide-react"

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAnalytics(data.data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-500">Complete platform performance overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: analytics.totalUsers, change: analytics.userGrowth, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Total Courses", value: analytics.totalCourses, change: analytics.courseGrowth, icon: BookOpen, color: "bg-green-50 text-green-600" },
          { label: "Enrollments", value: analytics.totalEnrollments, change: analytics.enrollmentGrowth, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
          { label: "Certificates", value: analytics.totalCertificates, change: analytics.certificateGrowth, icon: Award, color: "bg-yellow-50 text-yellow-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm font-medium text-gray-900">{stat.label}</p>
            {stat.change !== undefined && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${stat.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stat.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(stat.change)}% from last month
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Enrollments */}
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
                    {month.count} enrollments
                  </div>
                </div>
                <span className="text-xs text-gray-500">{month.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Courses */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Top Performing Courses</h2>
          <div className="space-y-3">
            {analytics.topCourses?.map((course: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{course.title}</p>
                  <p className="text-xs text-gray-500">{course.enrollments} enrollments</p>
                </div>
                <div className="text-sm font-medium text-gray-900">{course.completionRate}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Activity</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analytics.recentActivity?.map((activity: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {new Date(activity.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      activity.type === "enrollment" ? "bg-blue-100 text-blue-700" :
                      activity.type === "completion" ? "bg-green-100 text-green-700" :
                      activity.type === "certificate" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {activity.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">{activity.user}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{activity.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}