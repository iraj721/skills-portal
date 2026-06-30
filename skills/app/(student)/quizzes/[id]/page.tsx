"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"

export default function QuizAttemptPage() {
  const params = useParams()
  const router = useRouter()
  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number[]>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [message, setMessage] = useState("")
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/student/quiz-attempts?quizId=${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setQuiz(data.data.quiz)
            setTimeLeft((data.data.timeLimitMinutes || 15) * 60)
          } else if (data.error?.code === "ALREADY_ATTEMPTED") {
            setResult(data.error.data)
            setMessage("You have already attempted this quiz!")
          } else {
            setMessage(data.error?.message || "Failed to load quiz")
          }
          setLoading(false)
        })
    }
  }, [params.id])

  // Timer
  useEffect(() => {
    if (!quiz || timeLeft <= 0 || result) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [quiz, timeLeft, result])

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  function toggleAnswer(questionIndex: number, optionIndex: number) {
    const question = quiz.questions[questionIndex]
    setAnswers((prev) => {
      const current = prev[questionIndex] || []
      if (question.questionType === "mcq" || question.questionType === "true_false") {
        return { ...prev, [questionIndex]: [optionIndex] }
      } else {
        // Multiple select
        if (current.includes(optionIndex)) {
          return { ...prev, [questionIndex]: current.filter((a) => a !== optionIndex) }
        } else {
          return { ...prev, [questionIndex]: [...current, optionIndex] }
        }
      }
    })
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    try {
      const timeTaken = ((quiz.timeLimitMinutes || 15) * 60) - timeLeft
      const res = await fetch("/api/student/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: params.id,
          answers,
          timeTakenSeconds: timeTaken,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
        setMessage(data.message)
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B6623]" />
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className={`bg-white rounded-2xl border p-8 text-center ${result.passed ? "border-green-200" : "border-yellow-200"}`}>
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${result.passed ? "bg-green-100" : "bg-yellow-100"}`}>
            {result.passed ? <CheckCircle className="w-10 h-10 text-green-600" /> : <XCircle className="w-10 h-10 text-yellow-600" />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{result.passed ? "Congratulations!" : "Quiz Completed"}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{result.attempt.score}</p>
              <p className="text-sm text-gray-500">Score</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{result.attempt.percentage}%</p>
              <p className="text-sm text-gray-500">Percentage</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{result.attempt.totalMarks}</p>
              <p className="text-sm text-gray-500">Total Marks</p>
            </div>
          </div>
          <Link href="/my-courses" className="inline-flex items-center gap-2 bg-[#0B6623] text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90">
            Back to My Courses
          </Link>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600">{message || "Quiz not available"}</p>
        <Link href="/my-courses" className="text-[#0B6623] font-medium hover:underline mt-4 inline-block">
          Back to My Courses
        </Link>
      </div>
    )
  }

  const question = quiz.questions[currentQuestion]
  const isLastQuestion = currentQuestion === quiz.questions.length - 1

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/my-courses" className="flex items-center gap-2 text-gray-500 hover:text-[#0B6623]">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Exit Quiz</span>
        </Link>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 60 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
          <Clock className="w-4 h-4" />
          <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <span>{Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div className="bg-[#0B6623] h-2 rounded-full transition-all" style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{question.question}</h2>
        <div className="space-y-3">
          {question.options.map((option: string, index: number) => {
            const isSelected = (answers[currentQuestion] || []).includes(index)
            return (
              <button
                key={index}
                onClick={() => toggleAnswer(currentQuestion, index)}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? "border-[#0B6623] bg-[#0B6623]/5"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? "border-[#0B6623] bg-[#0B6623]" : "border-gray-300"
                }`}>
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <span className="text-gray-700">{option}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {question.questionType === "multiple_select" ? "Select all that apply" : "Select one answer"}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || !answers[currentQuestion]?.length}
            className="flex items-center gap-2 bg-[#0B6623] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestion((p) => p + 1)}
            disabled={!answers[currentQuestion]?.length}
            className="flex items-center gap-2 bg-[#0B6623] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}