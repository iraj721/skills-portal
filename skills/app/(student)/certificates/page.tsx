"use client"

import { useEffect, useState } from "react"
import { Award, Download, Calendar, CheckCircle } from "lucide-react"

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/student/certificates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCertificates(data.data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
        <div className="grid sm:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-500">Download your earned certificates</p>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No certificates yet</h3>
          <p className="text-gray-500 mb-6">Complete courses to earn certificates</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-pnp-green/10 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-[#0B6623]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{cert.course?.title}</h3>
                  <p className="text-sm text-gray-500">Certificate of Completion</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Certificate #{cert.certificateNumber}
                </div>
              </div>
              <button
                onClick={() => window.open(cert.pdfUrl, '_blank')}
                className="w-full flex items-center justify-center gap-2 border border-[#0B6623] text-[#0B6623] py-2.5 rounded-lg font-medium hover:bg-[#0B6623] hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Certificate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}