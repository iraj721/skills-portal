"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, HelpCircle, Clock, Award, Users, Edit, Trash2, Eye, Loader2 } from "lucide-react"

export default function InstructorQuizzesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState("")

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(authData => {
        if (!authData.success || (authData.user.role !== "instructor" && authData.user.role !== "admin")) {
          router.push("/dashboard")
          return
        }
        
        // FIXED: Separate fetches with proper error handling
        return fetch("/api/instructor/courses")
          .then(r => r.json())
          .then(coursesData => {
            if (coursesData?.success) setCourses(coursesData.data)
            return fetch("/api/instructor/quizzes")
          })
          .then(r => r.json())
          .then(quizzesData => {
            if (quizzesData?.success) setQuizzes(quizzesData.data)
          })
      })
      .catch(err => {
        console.error("Error loading quizzes:", err)
      })
      .finally(() => setLoading(false))
  }, [router])

  async function handleDelete(quizId: string) {
    if (!confirm("Are you sure you want to delete this quiz?")) return
    
    try {
      const res = await fetch(`/api/instructor/quizzes/${quizId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setQuizzes(prev => prev.filter(q => q.id !== quizId))
      } else {
        alert(data.error?.message || "Failed to delete")
      }
    } catch (err) {
      console.error(err)
      alert("Something went wrong")
    }
  }

  const filteredQuizzes = selectedCourse
    ? quizzes.filter(q => q.courseId === selectedCourse)
    : quizzes

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B6623]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-500">Manage quizzes for your courses</p>
        </div>
        <Link
          href="/instructor/quizzes/new"
          className="flex items-center gap-2 bg-[#0B6623] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Quiz
        </Link>
      </div>

      {/* Course Filter */}
      <div className="bg-white rounded-xl border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none bg-white"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold">{quizzes.length}</p>
          <p className="text-sm text-gray-500">Total Quizzes</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold">{quizzes.filter(q => q.isActive).length}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold">
            {quizzes.reduce((sum, q) => sum + (q.attempts?.length || 0), 0)}
          </p>
          <p className="text-sm text-gray-500">Total Attempts</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold">
            {quizzes.filter(q => q.attempts?.length > 0).length}
          </p>
          <p className="text-sm text-gray-500">Attempted</p>
        </div>
      </div>

      {/* Quizzes List */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">No quizzes found</p>
          <p className="text-sm text-gray-400">Create your first quiz to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Quiz</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Week</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Questions</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Attempts</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredQuizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{quiz.title}</p>
                      <p className="text-sm text-gray-500">{quiz.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {quiz.course?.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
                      Week {quiz.weekNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {quiz.questions?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {quiz.attempts?.length || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      quiz.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {quiz.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/instructor/quizzes/${quiz.id}`}
                        className="p-2 text-gray-400 hover:text-[#0B6623] hover:bg-[#0B6623]/10 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/instructor/quizzes/${quiz.id}/edit`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}