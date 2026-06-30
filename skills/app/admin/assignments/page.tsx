"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Plus, Clock, Users, CheckCircle, AlertCircle, ArrowRight, Trash2 } from "lucide-react"

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/assignments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAssignments(data.data)
        setLoading(false)
      })
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this assignment?")) return
    
    try {
      const res = await fetch(`/api/admin/assignments/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setAssignments(assignments.filter((a) => a.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">All Assignments</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Assignments</h1>
          <p className="text-gray-500">Manage all assignments across the platform</p>
        </div>
        <Link
          href="/admin/assignments/new"
          className="flex items-center gap-2 bg-[#0B6623] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments yet</h3>
          <p className="text-gray-500 mb-6">Create assignments for students</p>
          <Link
            href="/admin/assignments/new"
            className="inline-flex items-center gap-2 bg-[#0B6623] text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90"
          >
            <Plus className="w-4 h-4" />
            Create First Assignment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                    {new Date(assignment.dueDate) < new Date() ? (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Closed</span>
                    ) : (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Open</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    <span className="font-medium">Course:</span> {assignment.course?.title}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    <span className="font-medium">Instructor:</span> {assignment.course?.instructor?.fullName || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {assignment.totalMarks} marks
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {assignment.submissions?.length || 0} submissions
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {assignment.submissions?.filter((s: any) => s.status === "graded").length || 0} graded
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={`/admin/assignments/${assignment.id}`}
                    className="flex items-center gap-1 text-[#0B6623] font-medium text-sm hover:underline"
                  >
                    View <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}