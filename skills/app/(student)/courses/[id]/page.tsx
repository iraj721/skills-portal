"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { BookOpen, Clock, Users, Award, CheckCircle, PlayCircle, ArrowLeft, Star, FileText, ChevronDown, ChevronUp, AlertTriangle, Lock } from "lucide-react"

export default function CourseDetailPage() {
  const params = useParams()
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [message, setMessage] = useState("")
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollmentStats, setEnrollmentStats] = useState({
    totalEnrolled: 0,
    maxCourses: 3,
    hasFreelancing: false,
    canEnroll: true,
  })

  useEffect(() => {
    if (params.id) {
      Promise.all([
        fetch(`/api/courses/${params.id}`).then(r => r.json()),
        fetch("/api/enrollments").then(r => r.json()),
      ]).then(([courseData, enrollData]) => {
        if (courseData.success) {
          setCourse(courseData.data)
        }
        if (enrollData.success) {
          const activeEnrollments = enrollData.data.filter((e: any) => e.status === "active")
          const hasFreelancing = activeEnrollments.some((e: any) => 
            e.course?.category?.slug === "freelancing"
          )
          const enrolledInThis = activeEnrollments.some((e: any) => e.courseId === courseData.data?.id)
          setIsEnrolled(enrolledInThis)
          setEnrollmentStats({
            totalEnrolled: activeEnrollments.length,
            maxCourses: 3,
            hasFreelancing,
            canEnroll: activeEnrollments.length < 3,
          })
        }
        setLoading(false)
      })
    }
  }, [params.id])

  async function handleEnroll() {
    if (!course) return
    setEnrolling(true)
    setMessage("")
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage(data.message || "Enrolled successfully!")
        setIsEnrolled(true)
        setEnrollmentStats(prev => ({
          ...prev,
          totalEnrolled: prev.totalEnrolled + 1,
          canEnroll: prev.totalEnrolled + 1 < 3,
          hasFreelancing: prev.hasFreelancing || course.category?.slug === "freelancing",
        }))
        setTimeout(() => setMessage(""), 5000)
      } else {
        setMessage(data.error?.message || "Failed to enroll")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setEnrolling(false)
    }
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">Course not found</h2>
        <Link href="/courses" className="text-[#0B6623] font-medium hover:underline">
          Browse all courses
        </Link>
      </div>
    )
  }

  const isFreelancing = course.category?.slug === "freelancing"
  const totalLessons = course.modules?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Enrollment Status Banner */}
      {!isEnrolled && (
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-500">Your Enrollment: </span>
                <span className="font-semibold text-[#0B6623]">{enrollmentStats.totalEnrolled}/{enrollmentStats.maxCourses}</span>
              </div>
              {enrollmentStats.hasFreelancing && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Freelancing ✓
                </span>
              )}
            </div>
            {!enrollmentStats.canEnroll && (
              <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                <Lock className="w-4 h-4" /> Batch Full
              </span>
            )}
          </div>
          {!enrollmentStats.hasFreelancing && !isFreelancing && enrollmentStats.totalEnrolled >= 2 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Freelancing course is compulsory. You must enroll in Freelancing before selecting more courses.
            </div>
          )}
        </div>
      )}

      {/* Breadcrumb */}
      <Link href="/courses" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0B6623] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Link>

      {/* Course Header */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="h-64 bg-gray-100 relative">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0B6623]/10 to-[#22c55e]/10">
              <BookOpen className="w-20 h-20 text-[#0B6623]/30" />
            </div>
          )}
          <div className="absolute top-4 left-4 bg-[#0B6623] text-white text-sm px-3 py-1.5 rounded-full font-medium">
            Free
          </div>
          {isFreelancing && (
            <div className="absolute top-4 right-4 bg-yellow-500 text-white text-sm px-3 py-1.5 rounded-full font-medium">
              Compulsory
            </div>
          )}
        </div>
        
        <div className="p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium capitalize">
              {course.level}
            </span>
            <span className="text-gray-500 text-sm">{course.language}</span>
            {course.category && (
              <span className="bg-[#0B6623]/10 text-[#0B6623] text-xs px-3 py-1 rounded-full font-medium">
                {course.category.name}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-yellow-500">
              <Star className="w-4 h-4 fill-yellow-500" /> 4.8
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>
          <p className="text-gray-600 text-lg mb-6 leading-relaxed">{course.description}</p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                {course.instructor?.fullName?.charAt(0)}
              </div>
              <span>{course.instructor?.fullName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {course.totalStudents || 0} students
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {course.durationHours} hours
            </div>
            <div className="flex items-center gap-1">
              <PlayCircle className="w-4 h-4" />
              {totalLessons} lessons
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm mb-6 ${message.includes("success") || message.includes("Enrolled") ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
              {message}
            </div>
          )}

          {isEnrolled ? (
            <Link
              href={`/learn/${course.id}`}
              className="inline-flex items-center gap-2 bg-[#0B6623] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-opacity-90 transition-all shadow-lg"
            >
              <PlayCircle className="w-5 h-5" />
              Start Learning
            </Link>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling || !enrollmentStats.canEnroll}
              className="inline-flex items-center gap-2 bg-[#0B6623] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enrolling ? (
                <span className="animate-spin">...</span>
              ) : !enrollmentStats.canEnroll ? (
                <>
                  <Lock className="w-5 h-5" />
                  Batch Full (3/3)
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Enroll Now - Free
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {course.whatYouLearn && course.whatYouLearn.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What You&apos;ll Learn</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {course.whatYouLearn.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#0B6623] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {course.requirements && course.requirements.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {course.requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Course Curriculum</h2>
              <p className="text-sm text-gray-500 mt-1">{course.modules?.length || 0} modules • {totalLessons} lessons</p>
            </div>
            <div className="divide-y">
              {course.modules?.map((module: any) => (
                <div key={module.id}>
                  <button
                    onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{module.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{module.lessons?.length || 0} lessons</p>
                    </div>
                    {expandedModule === module.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedModule === module.id && module.lessons && (
                    <div className="bg-gray-50 divide-y">
                      {module.lessons.map((lesson: any) => (
                        <div key={lesson.id} className="flex items-center gap-3 p-4 pl-8">
                          <PlayCircle className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{lesson.title}</p>
                            {lesson.durationMinutes && (
                              <p className="text-xs text-gray-500">{lesson.durationMinutes} min</p>
                            )}
                          </div>
                          {lesson.isFreePreview && (
                            <span className="text-xs bg-[#0B6623]/10 text-[#0B6623] px-2 py-0.5 rounded-full">Preview</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold text-gray-900 mb-4">Instructor</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-[#0B6623] rounded-full flex items-center justify-center text-white text-xl font-bold">
                {course.instructor?.fullName?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{course.instructor?.fullName}</p>
                <p className="text-sm text-gray-500">Course Instructor</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold text-gray-900 mb-4">This Course Includes</h3>
            <div className="space-y-3">
              {[
                { icon: PlayCircle, text: `${totalLessons} video lessons` },
                { icon: Clock, text: `${course.durationHours} hours content` },
                { icon: FileText, text: "Assignments & projects" },
                { icon: Award, text: "Certificate of completion" },
                { icon: Users, text: "Lifetime access" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <item.icon className="w-4 h-4 text-[#0B6623]" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}