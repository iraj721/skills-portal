"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, CheckCircle, XCircle, Save, Loader2, User, Clock, Award } from "lucide-react"

export default function GradeAssignmentPage() {
  const params = useParams()
  const [assignment, setAssignment] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gradingId, setGradingId] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/instructor/assignments/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAssignment(data.data.assignment)
            setSubmissions(data.data.submissions)
          }
          setLoading(false)
        })
    }
  }, [params.id])

  async function handleGrade(submissionId: string, marksObtained: number, feedback: string, status: "graded" | "resubmit") {
    setGradingId(submissionId)
    try {
      const res = await fetch(`/api/instructor/submissions/${submissionId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marksObtained, feedback, status }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmissions(submissions.map((s) => s.id === submissionId ? data.data : s))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGradingId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="text-center py-20">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Assignment not found</h2>
      </div>
    )
  }

  const pendingSubmissions = submissions.filter((s) => s.status === "submitted")
  const gradedSubmissions = submissions.filter((s) => s.status === "graded" || s.status === "resubmit")

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/instructor/assignments" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0B6623] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </Link>

      <div className="bg-white rounded-xl border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
        <p className="text-gray-500 mb-4">{assignment.course?.title}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            {assignment.totalMarks} marks
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {submissions.length} submissions
          </span>
        </div>
      </div>

      {/* Pending Submissions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Pending Submissions ({pendingSubmissions.length})</h2>
        
        {pendingSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p>All submissions have been graded!</p>
          </div>
        ) : (
          pendingSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              totalMarks={assignment.totalMarks}
              onGrade={handleGrade}
              grading={gradingId === submission.id}
            />
          ))
        )}
      </div>

      {/* Graded Submissions */}
      {gradedSubmissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Graded Submissions ({gradedSubmissions.length})</h2>
          {gradedSubmissions.map((submission) => (
            <div key={submission.id} className="bg-white rounded-xl border p-6 opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                  {submission.student?.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{submission.student?.fullName}</p>
                  <p className="text-xs text-gray-500">{submission.student?.email}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-bold text-lg">{submission.marksObtained}/{assignment.totalMarks}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    submission.status === "graded" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {submission.status}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</p>
              </div>
              {submission.feedback && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">Feedback:</p>
                  <p className="text-sm text-blue-700 mt-1">{submission.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SubmissionCard({ submission, totalMarks, onGrade, grading }: {
  submission: any
  totalMarks: number
  onGrade: (id: string, marks: number, feedback: string, status: "graded" | "resubmit") => void
  grading: boolean
}) {
  const [marks, setMarks] = useState("")
  const [feedback, setFeedback] = useState("")

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
          {submission.student?.fullName?.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900">{submission.student?.fullName}</p>
          <p className="text-xs text-gray-500">{submission.student?.email}</p>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          Submitted {new Date(submission.submittedAt).toLocaleDateString()}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marks (out of {totalMarks})</label>
          <input
            type="number"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
            min={0}
            max={totalMarks}
            placeholder="Enter marks"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
            placeholder="Optional feedback"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onGrade(submission.id, parseInt(marks) || 0, feedback, "graded")}
          disabled={grading || !marks}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {grading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Grade
        </button>
        <button
          onClick={() => onGrade(submission.id, 0, feedback, "resubmit")}
          disabled={grading}
          className="flex items-center gap-2 border border-yellow-500 text-yellow-600 px-4 py-2 rounded-lg font-medium hover:bg-yellow-50 disabled:opacity-50 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Request Resubmit
        </button>
      </div>
    </div>
  )
}