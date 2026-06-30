"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, Users, Clock, Eye, Edit, Send, CheckCircle, AlertCircle, Play, Video, Youtube, Monitor } from "lucide-react"

export default function InstructorCourseDetailPage() {
  const params = useParams()
  const [course, setCourse] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState("")
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/instructor/courses/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCourse(data.data.course)
            setStudents(data.data.students)
            // Set first video as active if available
            const firstModule = data.data.course.modules?.[0]
            const firstLesson = firstModule?.lessons?.[0]
            if (firstLesson) {
              setActiveVideo(firstLesson.id)
            }
          }
          setLoading(false)
        })
    }
  }, [params.id])

  async function handlePublish() {
    setPublishing(true)
    try {
      const res = await fetch(`/api/instructor/courses/${params.id}/publish`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        setCourse({ ...course, status: "pending" })
        setMessage("Course submitted for review!")
      } else {
        setMessage(data.error?.message || "Failed to publish")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setPublishing(false)
    }
  }

  function getVideoEmbedUrl(lesson: any): string {
    if (!lesson.videoUrl) return ""
    
    if (lesson.videoType === "youtube") {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
      const match = lesson.videoUrl.match(regExp)
      const videoId = (match && match[2].length === 11) ? match[2] : null
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ""
    }
    
    if (lesson.videoType === "vimeo") {
      const regExp = /vimeo\.com\/(\d+)/
      const match = lesson.videoUrl.match(regExp)
      const videoId = match ? match[1] : null
      return videoId ? `https://player.vimeo.com/video/${videoId}` : ""
    }
    
    // Direct upload - return as is
    return lesson.videoUrl
  }

  function getVideoIcon(videoType: string) {
    switch (videoType) {
      case "youtube": return <Youtube className="w-4 h-4 text-red-500" />
      case "vimeo": return <Video className="w-4 h-4 text-blue-500" />
      case "upload": return <Monitor className="w-4 h-4 text-[#0B6623]" />
      default: return <Play className="w-4 h-4" />
    }
  }

  function getActiveLesson() {
    if (!course?.modules) return null
    for (const module of course.modules) {
      const lesson = module.lessons?.find((l: any) => l.id === activeVideo)
      if (lesson) return lesson
    }
    return null
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Course not found</h2>
      </div>
    )
  }

  const activeLesson = getActiveLesson()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/instructor/courses" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0B6623] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/instructor/courses/${params.id}/edit`}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          {course.status === "draft" && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 bg-[#0B6623] text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
              {publishing ? "Submitting..." : "Submit for Review"}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.includes("success") || message.includes("submitted") ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {message}
        </div>
      )}

      {/* Course Header */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="h-48 bg-gray-100 relative">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0B6623]/10 to-[#22c55e]/10">
              <BookOpen className="w-16 h-16 text-[#0B6623]/30" />
            </div>
          )}
          <div className={`absolute top-4 left-4 text-sm px-3 py-1.5 rounded-full font-medium ${
            course.status === "published" ? "bg-green-100 text-green-700" :
            course.status === "pending" ? "bg-yellow-100 text-yellow-700" :
            course.status === "draft" ? "bg-gray-100 text-gray-700" :
            "bg-red-100 text-red-700"
          }`}>
            {course.status === "published" && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Published</span>}
            {course.status === "pending" && <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pending Review</span>}
            {course.status === "draft" && "Draft"}
            {course.status === "archived" && "Archived"}
          </div>
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
          <p className="text-gray-600 mb-4">{course.description}</p>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {students.length} students enrolled
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {course.durationHours} hours
            </div>
            <div className="capitalize">{course.level}</div>
            <div>{course.language}</div>
            {course.category && (
              <div className="bg-[#0B6623]/10 text-[#0B6623] px-3 py-1 rounded-full text-xs font-medium">
                {course.category.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Player Section */}
      {activeLesson && (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="aspect-video bg-black relative">
            {activeLesson.videoType === "upload" ? (
              <video
                src={activeLesson.videoUrl}
                controls
                className="w-full h-full"
                poster={activeLesson.thumbnailUrl || undefined}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe
                src={getVideoEmbedUrl(activeLesson)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={activeLesson.title}
              />
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {getVideoIcon(activeLesson.videoType)}
              <h3 className="font-semibold text-gray-900">{activeLesson.title}</h3>
            </div>
            <p className="text-sm text-gray-500">{activeLesson.description}</p>
            {activeLesson.thumbnailUrl && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1">Lesson Thumbnail (640x360px)</p>
                <img 
                  src={activeLesson.thumbnailUrl} 
                  alt="Lesson thumbnail" 
                  className="w-40 h-24 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Curriculum / Video List */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Course Curriculum</h2>
        </div>
        <div className="p-4 space-y-4">
          {course.modules?.map((module: any, moduleIndex: number) => (
            <div key={module.id} className="space-y-2">
              <h3 className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                Module {moduleIndex + 1}: {module.title}
              </h3>
              <div className="space-y-1 pl-4">
                {module.lessons?.map((lesson: any, lessonIndex: number) => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveVideo(lesson.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      activeVideo === lesson.id 
                        ? "bg-[#0B6623]/10 border border-[#0B6623]/20" 
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {lesson.thumbnailUrl ? (
                        <img 
                          src={lesson.thumbnailUrl} 
                          alt="" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        getVideoIcon(lesson.videoType)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {lessonIndex + 1}. {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="capitalize">{lesson.videoType}</span>
                        <span>•</span>
                        <span>{lesson.durationMinutes} min</span>
                        {lesson.isFreePreview && (
                          <>
                            <span>•</span>
                            <span className="text-[#0B6623] font-medium">Free Preview</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-gray-900">{students.length}</p>
          <p className="text-sm text-gray-500">Total Students</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-gray-900">
            {students.filter((s) => s.status === "completed").length}
          </p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-3xl font-bold text-gray-900">
            {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + (s.progressPercent || 0), 0) / students.length) : 0}%
          </p>
          <p className="text-sm text-gray-500">Avg Progress</p>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Enrolled Students</h2>
        </div>
        <div className="p-4">
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No students enrolled yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {student.student?.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{student.student?.fullName}</h3>
                    <p className="text-xs text-gray-500">{student.student?.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{student.progressPercent}%</div>
                    <div className="text-xs text-gray-500 capitalize">{student.status}</div>
                  </div>
                  <div className="w-24">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#0B6623] h-2 rounded-full"
                        style={{ width: `${student.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}