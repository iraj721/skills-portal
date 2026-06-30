"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Award, Clock, TrendingUp, ArrowRight } from "lucide-react"

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [stats, setStats] = useState({ enrolled: 0, completed: 0, certificates: 0, inProgress: 0 })

  useEffect(() => {
    fetch("/api/enrollments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEnrollments(data.data)
          setStats({
            enrolled: data.data.length,
            completed: data.data.filter((e: any) => e.status === "completed").length,
            certificates: 0,
            inProgress: data.data.filter((e: any) => e.status === "active").length,
          })
        }
      })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Continue your learning journey.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enrolled Courses", value: stats.enrolled, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, color: "bg-yellow-50 text-yellow-600" },
          { label: "Completed", value: stats.completed, icon: TrendingUp, color: "bg-green-50 text-green-600" },
          { label: "Certificates", value: stats.certificates, icon: Award, color: "bg-purple-50 text-purple-600" },
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

      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Continue Learning</h2>
          <Link href="/my-courses" className="text-[#0B6623] text-sm font-medium flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4">
          {enrollments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No courses enrolled yet</p>
              <Link href="/courses" className="text-[#0B6623] font-medium mt-2 inline-block">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.slice(0, 3).map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-16 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {enrollment.course?.thumbnailUrl && (
                      <img src={enrollment.course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{enrollment.course?.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#0B6623] h-2 rounded-full"
                          style={{ width: `${enrollment.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{enrollment.progressPercent}%</span>
                    </div>
                  </div>
                  <Link
                    href={`/learn/${enrollment.course?.id}`}
                    className="bg-[#0B6623] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-opacity-90"
                  >
                    Continue
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}