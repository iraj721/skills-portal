"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Calendar, Users, Filter } from "lucide-react"

interface AttendanceWeek {
  weekNumber: number
  status: string
  lessonsWatched: number
  assignmentSubmitted: boolean
  quizSubmitted: boolean
  markedAt: string
}

interface StudentAttendance {
  enrollmentId: string
  student: {
    id: string
    fullName: string
    email: string
    avatarUrl: string | null
  }
  weeks: AttendanceWeek[]
  totalPresent: number
  totalAbsent: number
  attendancePercentage: number
}

export default function InstructorAttendancePage() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get("courseId")
  const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(courseId || "")

  useEffect(() => {
    fetch("/api/instructor/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCourses(data.data)
      })
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      setLoading(true)
      fetch(`/api/instructor/attendance?courseId=${selectedCourse}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setAttendanceData(data.data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
      setAttendanceData([])
    }
  }, [selectedCourse])

  async function handleMarkAttendance(enrollmentId: string, weekNumber: number, status: string) {
    try {
      const res = await fetch("/api/instructor/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, weekNumber, status }),
      })
      const data = await res.json()
      if (data.success) {
        fetch(`/api/instructor/attendance?courseId=${selectedCourse}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) setAttendanceData(data.data)
          })
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500">View and manage student attendance</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none bg-white"
        >
          <option value="">Select a course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      ) : !selectedCourse ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Filter className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Select a course to view attendance</p>
        </div>
      ) : attendanceData.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No students enrolled in this course</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attendanceData.map((student) => (
            <div key={student.enrollmentId} className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0B6623] rounded-full flex items-center justify-center text-white font-medium">
                    {student.student?.fullName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.student?.fullName || "Unknown"}</h3>
                    <p className="text-sm text-gray-500">{student.student?.email || ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${student.attendancePercentage >= 70 ? "text-green-600" : "text-yellow-600"}`}>
                    {student.attendancePercentage || 0}%
                  </p>
                  <p className="text-xs text-gray-500">{student.totalPresent || 0}/8 weeks present</p>
                </div>
              </div>

              <div className="grid grid-cols-8 gap-2">
                {student.weeks?.map((week) => (
                  <div key={week.weekNumber} className="text-center">
                    <button
                      onClick={() => handleMarkAttendance(student.enrollmentId, week.weekNumber, week.status === "present" ? "absent" : "present")}
                      className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                        week.status === "present"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : week.status === "absent"
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <div className="flex justify-center mb-1">
                        {week.status === "present" ? <CheckCircle className="w-4 h-4" /> :
                         week.status === "absent" ? <XCircle className="w-4 h-4" /> :
                         <Calendar className="w-4 h-4" />}
                      </div>
                      W{week.weekNumber}
                    </button>
                    <div className="mt-1 text-xs text-gray-400">
                      L:{week.lessonsWatched || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}