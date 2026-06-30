"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { 
  PlayCircle, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Clock,
  FileText,
  Award,
  Menu,
  X
} from "lucide-react"

export default function LearnPage() {
  const params = useParams()
  const [course, setCourse] = useState<any>(null)
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [currentModule, setCurrentModule] = useState<any>(null)
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)

  useEffect(() => {
    if (params.courseId) {
      fetch(`/api/courses/${params.courseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCourse(data.data)
            // Find first lesson
            const firstModule = data.data.modules?.[0]
            const firstLesson = firstModule?.lessons?.[0]
            if (firstLesson) {
              setCurrentModule(firstModule)
              setCurrentLesson(firstLesson)
            }
          }
          setLoading(false)
        })

      // Fetch progress
      fetch(`/api/progress?courseId=${params.courseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setProgress(data.data)
        })
    }
  }, [params.courseId])

  async function markLessonComplete() {
    if (!currentLesson) return
    setMarkingComplete(true)
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: currentLesson.id, isCompleted: true }),
      })
      const data = await res.json()
      if (data.success) {
        setProgress([...progress.filter((p) => p.lessonId !== currentLesson.id), data.data])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setMarkingComplete(false)
    }
  }

  function isLessonCompleted(lessonId: string) {
    return progress.some((p) => p.lessonId === lessonId && p.isCompleted)
  }

  function getNextLesson() {
    if (!course || !currentModule || !currentLesson) return null
    
    const lessonIndex = currentModule.lessons?.findIndex((l: any) => l.id === currentLesson.id)
    if (lessonIndex !== undefined && lessonIndex < (currentModule.lessons?.length || 0) - 1) {
      return { module: currentModule, lesson: currentModule.lessons[lessonIndex + 1] }
    }
    
    const moduleIndex = course.modules?.findIndex((m: any) => m.id === currentModule.id)
    if (moduleIndex !== undefined && moduleIndex < (course.modules?.length || 0) - 1) {
      const nextModule = course.modules[moduleIndex + 1]
      return { module: nextModule, lesson: nextModule.lessons?.[0] }
    }
    
    return null
  }

  function getPrevLesson() {
    if (!course || !currentModule || !currentLesson) return null
    
    const lessonIndex = currentModule.lessons?.findIndex((l: any) => l.id === currentLesson.id)
    if (lessonIndex !== undefined && lessonIndex > 0) {
      return { module: currentModule, lesson: currentModule.lessons[lessonIndex - 1] }
    }
    
    const moduleIndex = course.modules?.findIndex((m: any) => m.id === currentModule.id)
    if (moduleIndex !== undefined && moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1]
      return { module: prevModule, lesson: prevModule.lessons?.[prevModule.lessons.length - 1] }
    }
    
    return null
  }

  const nextLesson = getNextLesson()
  const prevLesson = getPrevLesson()
  const completedLessons = progress.filter((p) => p.isCompleted).length
  const totalLessons = course?.modules?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#0B6623] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900">Course not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Course Curriculum */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform overflow-y-auto`}>
        <div className="p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between mb-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-[#0B6623]">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="font-bold text-gray-900 truncate">{course.title}</h2>
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">{progressPercent}% complete</span>
              <span className="text-gray-500">{completedLessons}/{totalLessons} lessons</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#0B6623] h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="divide-y">
          {course.modules?.map((module: any) => (
            <div key={module.id}>
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold text-sm text-gray-900">{module.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{module.lessons?.length || 0} lessons</p>
              </div>
              <div className="divide-y">
                {module.lessons?.map((lesson: any) => {
                  const isCompleted = isLessonCompleted(lesson.id)
                  const isActive = currentLesson.id === lesson.id
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setCurrentModule(module)
                        setCurrentLesson(lesson)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors ${isActive ? "bg-[#0B6623]/5 border-l-2 border-l-[#0B6623]" : "border-l-2 border-l-transparent"}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <PlayCircle className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#0B6623]" : "text-gray-400"}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isActive ? "font-medium text-[#0B6623]" : "text-gray-700"}`}>
                          {lesson.title}
                        </p>
                        {lesson.durationMinutes && (
                          <p className="text-xs text-gray-500">{lesson.durationMinutes} min</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm truncate max-w-[200px]">{currentLesson.title}</span>
          <div className="w-8" />
        </header>

        {/* Video Player Area */}
        <div className="bg-black aspect-video lg:aspect-[21/9] relative">
          {currentLesson.videoUrl ? (
            currentLesson.videoType === "youtube" ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(currentLesson.videoUrl)}`}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : currentLesson.videoType === "vimeo" ? (
              <iframe
                src={`https://player.vimeo.com/video/${getVimeoId(currentLesson.videoUrl)}`}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video
                src={currentLesson.videoUrl}
                className="w-full h-full"
                controls
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No video available for this lesson</p>
              </div>
            </div>
          )}
        </div>

        {/* Lesson Info & Navigation */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-[#0B6623]/10 text-[#0B6623] px-2 py-0.5 rounded-full font-medium">
                    {currentModule?.title}
                  </span>
                  {isLessonCompleted(currentLesson.id) && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h1>
                {currentLesson.description && (
                  <p className="text-gray-600 mt-2">{currentLesson.description}</p>
                )}
              </div>
              
              {!isLessonCompleted(currentLesson.id) && (
                <button
                  onClick={markLessonComplete}
                  disabled={markingComplete}
                  className="flex items-center gap-2 bg-[#0B6623] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all"
                >
                  {markingComplete ? (
                    <span className="animate-spin">...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Mark Complete
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Lesson Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              {prevLesson ? (
                <button
                  onClick={() => {
                    setCurrentModule(prevLesson.module)
                    setCurrentLesson(prevLesson.lesson)
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#0B6623] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Previous</p>
                    <p className="text-sm font-medium truncate max-w-[200px]">{prevLesson.lesson.title}</p>
                  </div>
                </button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <button
                  onClick={() => {
                    setCurrentModule(nextLesson.module)
                    setCurrentLesson(nextLesson.lesson)
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#0B6623] transition-colors"
                >
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Next</p>
                    <p className="text-sm font-medium truncate max-w-[200px]">{nextLesson.lesson.title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2 text-[#0B6623]">
                  <Award className="w-5 h-5" />
                  <span className="font-medium">Course Complete!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match?.[1] || ""
}

function getVimeoId(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match?.[1] || ""
}