"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Award, Search, CheckCircle, Download, Users, Loader2 } from "lucide-react"

export default function InstructorCertificatesPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/instructor/completed-students")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEnrollments(data.data)
        setLoading(false)
      })
  }, [])

  async function generateCertificate(enrollmentId: string) {
    setGeneratingId(enrollmentId)
    try {
      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      })
      const data = await res.json()
      if (data.success) {
        setEnrollments(enrollments.map((e) => 
          e.id === enrollmentId ? { ...e, certificate: data.data } : e
        ))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingId(null)
    }
  }

  const filteredEnrollments = enrollments.filter((e) =>
    e.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    e.course?.title?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-500">Generate certificates for completed students</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or course..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed students yet</h3>
          <p className="text-gray-500">Students who complete 100% of your courses will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Course</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Completed</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Certificate</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEnrollments.map((enrollment) => (
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
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        {new Date(enrollment.completedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {enrollment.certificate ? (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Generated
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Not generated</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {enrollment.certificate ? (
                        <button
                          onClick={() => window.open(enrollment.certificate.pdfUrl, '_blank')}
                          className="flex items-center gap-1 text-[#0B6623] text-sm font-medium hover:underline"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      ) : (
                        <button
                          onClick={() => generateCertificate(enrollment.id)}
                          disabled={generatingId === enrollment.id}
                          className="flex items-center gap-1 bg-[#0B6623] text-white text-sm px-3 py-1.5 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all"
                        >
                          {generatingId === enrollment.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Award className="w-3 h-3" />
                          )}
                          Generate
                        </button>
                      )}
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