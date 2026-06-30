"use client"

import { useEffect, useState } from "react"
import { Award, Search, Download, CheckCircle, Calendar, User, BookOpen } from "lucide-react"

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/certificates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCertificates(data.data)
        setLoading(false)
      })
  }, [])

  const filteredCertificates = certificates.filter((cert) =>
    cert.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    cert.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
    cert.certificateNumber?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <div className="bg-white rounded-xl border animate-pulse h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-500">Manage all issued certificates</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student, course, or certificate number..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Certificate #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Course</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Issued Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-700">{cert.certificateNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                        {cert.student?.fullName?.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-700">{cert.student?.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{cert.course?.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      cert.isRevoked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                      {cert.isRevoked ? "Revoked" : "Valid"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => window.open(cert.pdfUrl, '_blank')}
                      className="flex items-center gap-1 text-[#0B6623] text-sm font-medium hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}