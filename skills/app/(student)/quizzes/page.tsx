"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { HelpCircle, Clock, Award, Lock, CheckCircle, ArrowRight, Loader2 } from "lucide-react"

export default function QuizzesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check auth
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(authData => {
        if (!authData.success) {
          router.push("/login")
          return
        }
        setUser(authData.user)
        return fetch("/api/student/quizzes")
      })
      .then(res => res?.json())
      .then(data => {
        if (data?.success) setQuizzes(data.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B6623]" />
      </div>
    )
  }

  const availableQuizzes = quizzes.filter(q => q.isAvailable)
  const lockedQuizzes = quizzes.filter(q => !q.isAvailable)
  const attemptedQuizzes = quizzes.filter(q => q.hasAttempted)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1>
        <p className="text-gray-500">Test your knowledge with course quizzes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{quizzes.length}</p>
              <p className="text-sm text-gray-500">Total Quizzes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{attemptedQuizzes.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {attemptedQuizzes.filter(q => q.attempt?.isPassed).length}
              </p>
              <p className="text-sm text-gray-500">Passed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Quizzes */}
      {availableQuizzes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Available to Attempt</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableQuizzes.map(quiz => (
              <QuizCard key={quiz.id} quiz={quiz} status="available" />
            ))}
          </div>
        </div>
      )}

      {/* Attempted Quizzes */}
      {attemptedQuizzes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Completed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attemptedQuizzes.map(quiz => (
              <QuizCard key={quiz.id} quiz={quiz} status="completed" />
            ))}
          </div>
        </div>
      )}

      {/* Locked Quizzes */}
      {lockedQuizzes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Locked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedQuizzes.map(quiz => (
              <QuizCard key={quiz.id} quiz={quiz} status="locked" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function QuizCard({ quiz, status }: { quiz: any; status: string }) {
  return (
    <div className={`bg-white rounded-xl border p-6 ${status === "locked" ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
              Week {quiz.weekNumber}
            </span>
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
              {quiz.course?.title}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>
        </div>
        {status === "locked" && (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
        )}
        {status === "completed" && quiz.attempt?.isPassed && (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        )}
        {status === "completed" && !quiz.attempt?.isPassed && (
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Award className="w-5 h-5 text-red-600" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <HelpCircle className="w-4 h-4" />
          {quiz.questions?.length || 0} Questions
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {quiz.timeLimitMinutes} min
        </div>
        <div className="flex items-center gap-1">
          <Award className="w-4 h-4" />
          Pass: {quiz.passingMarks}%
        </div>
      </div>

      {status === "available" && (
        <Link
          href={`/quizzes/${quiz.id}`}
          className="flex items-center justify-center gap-2 w-full bg-[#0B6623] text-white py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
        >
          Start Quiz
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {status === "completed" && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Score: {quiz.attempt?.score}/{quiz.attempt?.totalMarks}
              </p>
              <p className={`text-sm font-bold ${quiz.attempt?.isPassed ? "text-green-600" : "text-red-600"}`}>
                {quiz.attempt?.percentage}% {quiz.attempt?.isPassed ? "Passed" : "Failed"}
              </p>
            </div>
            <Link
              href={`/quizzes/${quiz.id}`}
              className="text-sm text-[#0B6623] font-medium hover:underline"
            >
              View Details
            </Link>
          </div>
        </div>
      )}

      {status === "locked" && (
        <div className="bg-gray-100 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">Complete previous week to unlock</p>
        </div>
      )}
    </div>
  )
}