"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Trash2, ArrowLeft, Loader2, CheckCircle, HelpCircle } from "lucide-react"

interface Question {
  question: string
  questionType: "mcq" | "true_false" | "multiple_select"
  options: string[]
  correctAnswers: number[]
  explanation: string
  marks: number
  sortOrder: number
}

export default function CreateQuizPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    courseId: "",
    weekNumber: 1,
    title: "",
    description: "",
    timeLimitMinutes: 15,
    passingMarks: 50,
    questions: [] as Question[],
  })

  useEffect(() => {
    fetch("/api/instructor/courses")
      .then(res => res.json())
      .then(data => {
        if (data.success) setCourses(data.data)
      })
  }, [])

  function addQuestion() {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: "",
          questionType: "mcq",
          options: ["", ""],
          correctAnswers: [0],
          explanation: "",
          marks: 10,
          sortOrder: prev.questions.length,
        },
      ],
    }))
  }

  function updateQuestion(index: number, field: string, value: any) {
    setFormData(prev => {
      const questions = [...prev.questions]
      questions[index] = { ...questions[index], [field]: value }
      return { ...prev, questions }
    })
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setFormData(prev => {
      const questions = [...prev.questions]
      const options = [...questions[qIndex].options]
      options[oIndex] = value
      questions[qIndex] = { ...questions[qIndex], options }
      return { ...prev, questions }
    })
  }

  function addOption(qIndex: number) {
    setFormData(prev => {
      const questions = [...prev.questions]
      questions[qIndex] = {
        ...questions[qIndex],
        options: [...questions[qIndex].options, ""],
      }
      return { ...prev, questions }
    })
  }

  function removeOption(qIndex: number, oIndex: number) {
    setFormData(prev => {
      const questions = [...prev.questions]
      const options = questions[qIndex].options.filter((_, i) => i !== oIndex)
      questions[qIndex] = {
        ...questions[qIndex],
        options,
        correctAnswers: questions[qIndex].correctAnswers.filter(i => i !== oIndex).map(i => i > oIndex ? i - 1 : i),
      }
      return { ...prev, questions }
    })
  }

  function toggleCorrectAnswer(qIndex: number, oIndex: number) {
    setFormData(prev => {
      const questions = [...prev.questions]
      const current = questions[qIndex].correctAnswers
      const isMultiple = questions[qIndex].questionType === "multiple_select"

      if (isMultiple) {
        questions[qIndex] = {
          ...questions[qIndex],
          correctAnswers: current.includes(oIndex)
            ? current.filter(i => i !== oIndex)
            : [...current, oIndex],
        }
      } else {
        questions[qIndex] = {
          ...questions[qIndex],
          correctAnswers: [oIndex],
        }
      }
      return { ...prev, questions }
    })
  }

  function removeQuestion(index: number) {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/instructor/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        router.push("/instructor/quizzes")
      } else {
        alert(data.error?.message || "Failed to create quiz")
      }
    } catch (err) {
      console.error(err)
      alert("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/instructor/quizzes" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Quiz</h1>
          <p className="text-gray-500">Add a new quiz to your course</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                required
                value={formData.courseId}
                onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Number</label>
              <input
                type="number"
                min={1}
                max={8}
                required
                value={formData.weekNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, weekNumber: parseInt(e.target.value) }))}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Week 1 Assessment"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the quiz"
              rows={2}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
              <input
                type="number"
                min={1}
                max={120}
                required
                value={formData.timeLimitMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, timeLimitMinutes: parseInt(e.target.value) }))}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={formData.passingMarks}
                onChange={(e) => setFormData(prev => ({ ...prev, passingMarks: parseInt(e.target.value) }))}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions ({formData.questions.length})</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-2 text-[#0B6623] font-medium hover:underline"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          {formData.questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white rounded-xl border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Question {qIndex + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                  placeholder="Enter your question"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={q.questionType}
                    onChange={(e) => updateQuestion(qIndex, "questionType", e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="multiple_select">Multiple Select</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={q.marks}
                    onChange={(e) => updateQuestion(qIndex, "marks", parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (optional)</label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)}
                    placeholder="Why this is correct"
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Options</label>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCorrectAnswer(qIndex, oIndex)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        q.correctAnswers.includes(oIndex)
                          ? "border-[#0B6623] bg-[#0B6623]"
                          : "border-gray-300"
                      }`}
                    >
                      {q.correctAnswers.includes(oIndex) && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] outline-none"
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="text-sm text-[#0B6623] font-medium hover:underline"
                >
                  + Add Option
                </button>
              </div>
            </div>
          ))}

          {formData.questions.length === 0 && (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed p-12 text-center">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No questions added yet</p>
              <button
                type="button"
                onClick={addQuestion}
                className="mt-2 text-[#0B6623] font-medium hover:underline"
              >
                Add your first question
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/instructor/quizzes"
            className="px-6 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || formData.questions.length === 0}
            className="flex items-center gap-2 bg-[#0B6623] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Create Quiz
          </button>
        </div>
      </form>
    </div>
  )
}