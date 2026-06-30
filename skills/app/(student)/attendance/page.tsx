"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, AlertTriangle, Calendar, Award } from "lucide-react"

export default function StudentAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/student/attendance")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAttendanceData(data.data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  const totalPresent = attendanceData.reduce((sum, c) => sum + (c.presentWeeks || 0), 0)
  const totalPossible = attendanceData.reduce((sum, c) => sum + 8, 0)
  const overallPercentage = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-500">Track your weekly attendance across all courses</p>
      </div>

      {/* Overall Stats */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Overall Attendance</h3>
            <p className="text-sm text-gray-500">{totalPresent} / {totalPossible} weeks present</p>
          </div>
          <div className={`text-3xl font-bold ${overallPercentage >= 70 ? "text-green-600" : "text-yellow-600"}`}>
            {overallPercentage}%
          </div>
        </div>
        <div className="bg-gray-200 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${overallPercentage >= 70 ? "bg-green-500" : "bg-yellow-500"}`} style={{ width: `${overallPercentage}%` }} />
        </div>
        {overallPercentage < 70 && (
          <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            70% attendance required for certificate
          </p>
        )}
        {overallPercentage >= 70 && (
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <Award className="w-4 h-4" />
            Certificate eligible! ✓
          </p>
        )}
      </div>

      {/* Per Course */}
      <div className="space-y-4">
        {attendanceData.map((course) => (
          <div key={course.courseId} className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{course.courseTitle}</h3>
              <span className={`text-lg font-bold ${course.attendancePercentage >= 70 ? "text-green-600" : "text-yellow-600"}`}>
                {course.attendancePercentage}%
              </span>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {course.weeks?.map((week: any) => (
                <div key={week.weekNumber} className="text-center">
                  <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-1 ${
                    week.status === "present" ? "bg-green-100 text-green-600" :
                    week.status === "absent" ? "bg-red-100 text-red-600" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {week.status === "present" ? <CheckCircle className="w-5 h-5" /> :
                     week.status === "absent" ? <XCircle className="w-5 h-5" /> :
                     <Calendar className="w-5 h-5" />}
                  </div>
                  <p className="text-xs text-gray-500">W{week.weekNumber}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}