"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Clock, AlertCircle, Upload, Send, Loader2, CheckCircle } from "lucide-react"

export default function AssignmentDetailPage() {
  const params = useParams()
  const [assignment, setAssignment] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (params.id) {
      fetch(`/api/student/assignments/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAssignment(data.data.assignment)
            setSubmission(data.data.submission)
            if (data.data.submission?.content) {
              setContent(data.data.submission.content)
            }
          }
          setLoading(false)
        })
    }
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    
    setSubmitting(true)
    setMessage("")
    
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: params.id,
          content,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmission(data.data)
        setMessage("Assignment submitted successfully!")
      } else {
        setMessage(data.error?.message || "Failed to submit")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
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

  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date()
  const canSubmit = !submission && !isOverdue

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/assignments" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0B6623] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </Link>

      {/* Assignment Header */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
              {submission?.status === "graded" && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  Graded: {submission.marksObtained}/{assignment.totalMarks}
                </span>
              )}
              {submission?.status === "submitted" && (
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  Submitted
                </span>
              )}
              {isOverdue && !submission && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  Overdue
                </span>
              )}
            </div>
            <p className="text-gray-500">{assignment.course?.title}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <AlertCircle className="w-4 h-4" />
              {assignment.totalMarks} marks
            </div>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{assignment.instructions || assignment.description}</p>
        </div>

        {assignment.attachmentUrl && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <a 
              href={assignment.attachmentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#0B6623] font-medium text-sm hover:underline"
            >
              <FileText className="w-4 h-4" />
              Download Reference Material
            </a>
          </div>
        )}
      </div>

      {/* Submission Area */}
      {submission ? (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-bold text-gray-900 mb-4">Your Submission</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-700 whitespace-pre-wrap">{submission.content}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span>Submitted on {new Date(submission.submittedAt).toLocaleDateString()}</span>
            <span className="capitalize">Status: {submission.status}</span>
          </div>

          {submission.status === "graded" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Graded</h4>
              </div>
              <p className="text-green-700 text-sm">
                Marks: <span className="font-bold">{submission.marksObtained}</span> / {assignment.totalMarks}
              </p>
              {submission.feedback && (
                <div className="mt-2">
                  <p className="text-sm text-green-700 font-medium">Feedback:</p>
                  <p className="text-sm text-green-600 mt-1">{submission.feedback}</p>
                </div>
              )}
            </div>
          )}

          {submission.status === "resubmit" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-1">Resubmission Required</h4>
              <p className="text-sm text-yellow-700">{submission.feedback || "Please review and resubmit your assignment."}</p>
            </div>
          )}
        </div>
      ) : canSubmit ? (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-bold text-gray-900 mb-4">Submit Assignment</h3>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm mb-4 ${message.includes("success") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Answer</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none resize-none"
                placeholder="Write your answer here..."
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Attach File
              </button>
              
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="flex items-center gap-2 bg-[#0B6623] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Assignment
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <h3 className="font-semibold text-red-800">Submission Closed</h3>
          <p className="text-red-600 text-sm mt-1">The deadline for this assignment has passed.</p>
        </div>
      )}
    </div>
  )
}