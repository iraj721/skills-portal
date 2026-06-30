"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, Save, Upload, Video, Youtube, Monitor, ImageIcon, X } from "lucide-react"

interface Lesson {
  id: string
  title: string
  description: string
  videoUrl: string
  videoType: "youtube" | "vimeo" | "upload"
  durationMinutes: number
  isFreePreview: boolean
  thumbnailUrl: string
}

interface Module {
  id: string
  title: string
  description: string
  lessons: Lesson[]
}

interface Category {
  id: string
  name: string
  thumbnailUrl: string
}

export default function CreateCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"basic" | "curriculum">("basic")

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    categoryId: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    language: "Urdu",
    durationHours: 0,
    requirements: [""],
    whatYouLearn: [""],
  })

  const [modules, setModules] = useState<Module[]>([
    {
      id: "module-1",
      title: "",
      description: "",
      lessons: [
        {
          id: "lesson-1-1",
          title: "",
          description: "",
          videoUrl: "",
          videoType: "youtube" as const,
          durationMinutes: 0,
          isFreePreview: false,
          thumbnailUrl: "",
        },
      ],
    },
  ])

  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data)
        setCategoriesLoading(false)
      })
      .catch(() => setCategoriesLoading(false))
  }, [])

  function addModule() {
    setModules([
      ...modules,
      {
        id: `module-${modules.length + 1}`,
        title: "",
        description: "",
        lessons: [],
      },
    ])
  }

  function removeModule(moduleIndex: number) {
    setModules(modules.filter((_, i) => i !== moduleIndex))
  }

  function addLesson(moduleIndex: number) {
    const newModules = [...modules]
    newModules[moduleIndex].lessons.push({
      id: `lesson-${moduleIndex + 1}-${newModules[moduleIndex].lessons.length + 1}`,
      title: "",
      description: "",
      videoUrl: "",
      videoType: "youtube" as const,
      durationMinutes: 0,
      isFreePreview: false,
      thumbnailUrl: "",
    })
    setModules(newModules)
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    const newModules = [...modules]
    newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex)
    setModules(newModules)
  }

  function updateModule(moduleIndex: number, field: string, value: string) {
    const newModules = [...modules]
    newModules[moduleIndex] = { ...newModules[moduleIndex], [field]: value }
    setModules(newModules)
  }

  function updateLesson(moduleIndex: number, lessonIndex: number, field: string, value: any) {
    const newModules = [...modules]
    newModules[moduleIndex].lessons[lessonIndex] = {
      ...newModules[moduleIndex].lessons[lessonIndex],
      [field]: value,
    }
    setModules(newModules)
  }

  async function handleVideoUpload(moduleIndex: number, lessonIndex: number, file: File) {
    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file")
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      alert("Video size should be less than 500MB")
      return
    }

    const lessonId = modules[moduleIndex].lessons[lessonIndex].id
    const uploadKey = `upload-${moduleIndex}-${lessonIndex}`
    
    // Set uploading state
    updateLesson(moduleIndex, lessonIndex, "videoUrl", "uploading")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "course-videos")
      formData.append("lessonId", lessonId)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        updateLesson(moduleIndex, lessonIndex, "videoUrl", data.data.url)
        // Auto-set duration if available from server
        if (data.data.duration) {
          updateLesson(moduleIndex, lessonIndex, "durationMinutes", Math.round(data.data.duration / 60))
        }
      } else {
        updateLesson(moduleIndex, lessonIndex, "videoUrl", "")
        alert(data.error?.message || "Upload failed")
      }
    } catch (error) {
      updateLesson(moduleIndex, lessonIndex, "videoUrl", "")
      alert("Upload failed. Please try again.")
    }
  }

  async function handleLessonThumbnailUpload(moduleIndex: number, lessonIndex: number, file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB")
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "lesson-thumbnails")
      formData.append("width", "640")
      formData.append("height", "360")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        updateLesson(moduleIndex, lessonIndex, "thumbnailUrl", data.data.url)
      }
    } catch (error) {
      alert("Thumbnail upload failed")
    }
  }

  function addRequirement() {
    setFormData({ ...formData, requirements: [...formData.requirements, ""] })
  }

  function updateRequirement(index: number, value: string) {
    const newReqs = [...formData.requirements]
    newReqs[index] = value
    setFormData({ ...formData, requirements: newReqs })
  }

  function removeRequirement(index: number) {
    setFormData({ ...formData, requirements: formData.requirements.filter((_, i) => i !== index) })
  }

  function addWhatYouLearn() {
    setFormData({ ...formData, whatYouLearn: [...formData.whatYouLearn, ""] })
  }

  function updateWhatYouLearn(index: number, value: string) {
    const newItems = [...formData.whatYouLearn]
    newItems[index] = value
    setFormData({ ...formData, whatYouLearn: newItems })
  }

  function removeWhatYouLearn(index: number) {
    setFormData({ ...formData, whatYouLearn: formData.whatYouLearn.filter((_, i) => i !== index) })
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  function extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  function extractVimeoId(url: string): string | null {
    const regExp = /vimeo\.com\/(\d+)/
    const match = url.match(regExp)
    return match ? match[1] : null
  }

  function getVideoEmbedUrl(lesson: Lesson): string {
    if (lesson.videoType === "youtube" && lesson.videoUrl) {
      const videoId = extractYouTubeId(lesson.videoUrl)
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ""
    }
    if (lesson.videoType === "vimeo" && lesson.videoUrl) {
      const videoId = extractVimeoId(lesson.videoUrl)
      return videoId ? `https://player.vimeo.com/video/${videoId}` : ""
    }
    return lesson.videoUrl || ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const courseData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        modules: modules.map((m, i) => ({
          ...m,
          sortOrder: i,
          lessons: m.lessons.map((l, j) => ({
            ...l,
            sortOrder: j,
            videoUrl: l.videoType === "upload" ? l.videoUrl : getVideoEmbedUrl(l),
          })),
        })),
      }

      const res = await fetch("/api/instructor/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      })

      const data = await res.json()

      if (data.success) {
        setMessage("Course created successfully!")
        setTimeout(() => router.push("/instructor/courses"), 1500)
      } else {
        setMessage(data.error?.message || "Failed to create course")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/instructor/courses" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0B6623] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
        <p className="text-gray-500">Fill in the details to create your course</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.includes("success") ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("basic")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "basic" ? "bg-white text-[#0B6623] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          Basic Info
        </button>
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "curriculum" ? "bg-white text-[#0B6623] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          Curriculum
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "basic" ? (
          <div className="bg-white rounded-xl border p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Course Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })
                }}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                placeholder="e.g., Digital Marketing Masterclass"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none bg-gray-50"
                placeholder="digital-marketing-masterclass"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated from title. You can customize it.</p>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description *</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                placeholder="Brief description for course cards"
                maxLength={200}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.shortDescription.length}/200 characters</p>
            </div>

            {/* Full Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none resize-none"
                placeholder="Detailed course description..."
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <div className="relative">
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none bg-white"
                    required
                  >
                    <option value="">Select Category</option>
                    {categoriesLoading ? (
                      <option disabled>Loading categories...</option>
                    ) : categories.length === 0 ? (
                      <option disabled>No categories found. Add categories first.</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    )}
                  </select>
                  {categories.length === 0 && !categoriesLoading && (
                    <p className="text-xs text-red-500 mt-1">
                      No categories available. <Link href="/instructor/categories" className="underline text-[#0B6623]">Add categories first</Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none bg-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Language */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none bg-white"
                >
                  <option value="Urdu">Urdu</option>
                  <option value="English">English</option>
                  <option value="Both">Urdu + English</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (hours)</label>
                <input
                  type="number"
                  value={formData.durationHours}
                  onChange={(e) => setFormData({ ...formData, durationHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                  min={0}
                />
              </div>
            </div>

            {/* What You'll Learn */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">What Students Will Learn</label>
              <div className="space-y-2">
                {formData.whatYouLearn.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateWhatYouLearn(i, e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                      placeholder="e.g., Create professional marketing campaigns"
                    />
                    <button
                      type="button"
                      onClick={() => removeWhatYouLearn(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addWhatYouLearn}
                  className="flex items-center gap-2 text-[#0B6623] text-sm font-medium hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add learning outcome
                </button>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Requirements</label>
              <div className="space-y-2">
                {formData.requirements.map((req, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => updateRequirement(i, e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                      placeholder="e.g., Basic computer knowledge"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRequirement}
                  className="flex items-center gap-2 text-[#0B6623] text-sm font-medium hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add requirement
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) => updateModule(moduleIndex, "title", e.target.value)}
                      className="w-full bg-transparent font-semibold text-gray-900 outline-none placeholder-gray-400"
                      placeholder={`Module ${moduleIndex + 1} Title`}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeModule(moduleIndex)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <input
                    type="text"
                    value={module.description}
                    onChange={(e) => updateModule(moduleIndex, "description", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none text-sm"
                    placeholder="Module description (optional)"
                  />

                  {/* Lessons */}
                  <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, "title", e.target.value)}
                            className="flex-1 bg-transparent font-medium text-sm text-gray-900 outline-none placeholder-gray-400"
                            placeholder={`Lesson ${lessonIndex + 1} Title`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeLesson(moduleIndex, lessonIndex)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Video Type Selection */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateLesson(moduleIndex, lessonIndex, "videoType", "youtube")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              lesson.videoType === "youtube" 
                                ? "bg-red-50 text-red-600 border border-red-200" 
                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <Youtube className="w-4 h-4" />
                            YouTube
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLesson(moduleIndex, lessonIndex, "videoType", "vimeo")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              lesson.videoType === "vimeo" 
                                ? "bg-blue-50 text-blue-600 border border-blue-200" 
                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <Video className="w-4 h-4" />
                            Vimeo
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLesson(moduleIndex, lessonIndex, "videoType", "upload")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              lesson.videoType === "upload" 
                                ? "bg-[#0B6623]/10 text-[#0B6623] border border-[#0B6623]/20" 
                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <Monitor className="w-4 h-4" />
                            Upload
                          </button>
                        </div>

                        {/* Video Input based on type */}
                        {lesson.videoType === "upload" ? (
                          <div className="space-y-3">
                            {lesson.videoUrl && lesson.videoUrl !== "uploading" ? (
                              <div className="relative bg-gray-100 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                  <Video className="w-8 h-8 text-[#0B6623]" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">Video uploaded</p>
                                    <p className="text-xs text-gray-500">{lesson.videoUrl}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => updateLesson(moduleIndex, lessonIndex, "videoUrl", "")}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : lesson.videoUrl === "uploading" ? (
                              <div className="border-2 border-dashed border-[#0B6623]/30 rounded-lg p-8 text-center bg-[#0B6623]/5">
                                <Loader2 className="w-8 h-8 mx-auto mb-3 text-[#0B6623] animate-spin" />
                                <p className="text-sm font-medium text-[#0B6623]">Uploading video...</p>
                              </div>
                            ) : (
                              <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#0B6623] transition-colors cursor-pointer block">
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleVideoUpload(moduleIndex, lessonIndex, file)
                                  }}
                                  className="hidden"
                                />
                                <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                                <p className="text-sm text-gray-600 font-medium">Click to upload video from computer</p>
                                <p className="text-xs text-gray-500 mt-1">MP4, MOV, WebM up to 500MB</p>
                              </label>
                            )}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={lesson.videoUrl}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, "videoUrl", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                            placeholder={`Paste ${lesson.videoType === "youtube" ? "YouTube" : "Vimeo"} video URL here`}
                          />
                        )}

                        {/* Lesson Thumbnail */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lesson Thumbnail
                            <span className="text-xs text-gray-400 font-normal ml-2">(640x360px recommended)</span>
                          </label>
                          {lesson.thumbnailUrl ? (
                            <div className="relative w-fit">
                              <img 
                                src={lesson.thumbnailUrl} 
                                alt="Thumbnail" 
                                className="w-40 h-24 object-cover rounded-lg border"
                              />
                              <button
                                type="button"
                                onClick={() => updateLesson(moduleIndex, lessonIndex, "thumbnailUrl", "")}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#0B6623] transition-colors cursor-pointer block w-40">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleLessonThumbnailUpload(moduleIndex, lessonIndex, file)
                                }}
                                className="hidden"
                              />
                              <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                              <p className="text-xs text-gray-500">640x360px</p>
                            </label>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <input
                            type="number"
                            value={lesson.durationMinutes}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, "durationMinutes", parseInt(e.target.value) || 0)}
                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                            placeholder="Duration (min)"
                            min={0}
                          />
                        </div>

                        <textarea
                          value={lesson.description}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, "description", e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none resize-none"
                          placeholder="Lesson description (optional)"
                        />

                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={lesson.isFreePreview}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, "isFreePreview", e.target.checked)}
                            className="rounded border-gray-300 text-[#0B6623] focus:ring-[#0B6623]"
                          />
                          Free Preview (visible without enrollment)
                        </label>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addLesson(moduleIndex)}
                      className="flex items-center gap-2 text-[#0B6623] text-sm font-medium hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Add Lesson
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addModule}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-600 hover:border-[#0B6623] hover:text-[#0B6623] transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Module
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/instructor/courses"
            className="px-6 py-3 border rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          {activeTab === "basic" ? (
            <button
              type="button"
              onClick={() => setActiveTab("curriculum")}
              className="px-6 py-3 bg-[#0B6623] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
            >
              Next: Curriculum
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#0B6623] text-white rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? "Creating..." : "Create Course"}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}