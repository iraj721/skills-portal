"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, HelpCircle, Clock, Award, Users, CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quiz, setQuiz] = useState<any>(null)
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.id) return

    Promise.all([
      fetch(`/api/instructor/quizzes/${params.id}`).then(r => r.json()),
      fetch(`/api/instructor/quizzes/${params.id}/attempts`).then(r => r.json()),
    ])
      .then(([quizData, attemptsData]) => {
        if (quizData.success) setQuiz(quizData.data)
        if (attemptsData.success) setAttempts(attemptsData.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B6623]" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Quiz not found</p>
        <Link href="/instructor/quizzes" className="text-[#0B6623] hover:underline mt-2 inline-block">
          Back to Quizzes
        </Link>
      </div>
    )
  }

  const passedAttempts = attempts.filter((a: any) => a.isPassed)
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/instructor/quizzes" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-gray-500">{quiz.description}</p>
          </div>
        </div>
        <Link
          href={`/instructor/quizzes/${quiz.id}/edit`}
          className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50"
        >
          Edit Quiz
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{quiz.questions?.length || 0}</p>
              <p className="text-sm text-gray-500">Questions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{quiz.timeLimitMinutes}m</p>
              <p className="text-sm text-gray-500">Time Limit</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{attempts.length}</p>
              <p className="text-sm text-gray-500">Attempts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgScore}%</p>
              <p className="text-sm text-gray-500">Avg Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Preview */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Questions</h2>
        <div className="space-y-4">
          {quiz.questions?.map((q: any, index: number) => (
            <div key={q.id} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#0B6623] text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{q.question}</p>
                  <div className="mt-2 space-y-1">
                    {q.options?.map((opt: string, oIndex: number) => (
                      <div
                        key={oIndex}
                        className={`flex items-center gap-2 text-sm ${
                          q.correctAnswers?.includes(oIndex)
                            ? "text-green-600 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {q.correctAnswers?.includes(oIndex) ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300" />
                        )}
                        {opt}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Type: {q.questionType} | Marks: {q.marks}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attempts */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Student Attempts ({attempts.length})</h2>
        {attempts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No attempts yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Student</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Score</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Percentage</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Time Taken</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attempts.map((attempt: any) => (
                  <tr key={attempt.id}>
                    <td className="px-4 py-3 text-sm">{attempt.student?.fullName || "Unknown"}</td>
                    <td className="px-4 py-3 text-sm">{attempt.score}/{attempt.totalMarks}</td>
                    <td className="px-4 py-3 text-sm">{attempt.percentage}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        attempt.isPassed
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {attempt.isPassed ? "Passed" : "Failed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{attempt.timeTakenSeconds}s</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}