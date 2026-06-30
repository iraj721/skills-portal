"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Loader2, Save, Calendar, FileText, User } from "lucide-react"

export default function AdminCreateAssignmentPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const [formData, setFormData] = useState({
    courseId: "",
    moduleId: "",
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    totalMarks: 100,
  })

  useEffect(() => {
    // Fetch all courses
    fetch("/api/admin/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCourses(data.data)
      })
  }, [])

  const selectedCourse = courses.find((c) => c.id === formData.courseId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage("Assignment created successfully!")
        setTimeout(() => router.push("/admin/assignments"), 1500)
      } else {
        setMessage(data.error?.message || "Failed to create assignment")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/admin/assignments" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0B6623] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
        <p className="text-gray-500">Create a new assignment for any course</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.includes("success") ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-6">
        {/* Course Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Course *</label>
          <select
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value, moduleId: "" })}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none bg-white"
            required
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} {course.instructor ? `— ${course.instructor.fullName}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Module Selection */}
        {selectedCourse?.modules && selectedCourse.modules.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Module (Optional)</label>
            <select
              value={formData.moduleId}
              onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none bg-white"
            >
              <option value="">Select Module</option>
              {selectedCourse.modules.map((module: any) => (
                <option key={module.id} value={module.id}>{module.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Assignment Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
            placeholder="e.g., Final Project: Marketing Campaign"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none resize-none"
            placeholder="Brief description of the assignment"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions *</label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            rows={6}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none resize-none"
            placeholder="Detailed instructions for students..."
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Total Marks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Total Marks</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 0 })}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                min={1}
                max={1000}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <Link
            href="/admin/assignments"
            className="px-6 py-3 border rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#0B6623] text-white rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-md"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </form>
    </div>
  )
}