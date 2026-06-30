"use client"

import { useEffect, useState } from "react"
import { Users, Search, Mail, TrendingUp, Award, Filter } from "lucide-react"

export default function InstructorStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/instructor/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStudents(data.data)
        setLoading(false)
      })
  }, [])

  const filteredStudents = students.filter((s) =>
    s.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.student?.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.course?.title?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-500">Track and manage your students</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or course..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
          />
        </div>
        <button className="px-4 py-2.5 border rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500">Students will appear here once they enroll in your courses</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Course</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {enrollment.student?.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{enrollment.student?.fullName}</p>
                          <p className="text-xs text-gray-500">{enrollment.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{enrollment.course?.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#0B6623] h-2 rounded-full"
                            style={{ width: `${enrollment.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{enrollment.progressPercent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        enrollment.status === "completed" ? "bg-green-100 text-green-700" :
                        enrollment.status === "active" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}