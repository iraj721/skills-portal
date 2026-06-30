"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Filter, BookOpen, Clock, Users, CheckCircle, AlertTriangle, Lock } from "lucide-react"

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [myEnrollments, setMyEnrollments] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [enrollmentStats, setEnrollmentStats] = useState({
    totalEnrolled: 0,
    maxCourses: 3,
    hasFreelancing: false,
    canEnroll: true,
  })

  useEffect(() => {
    // Fetch courses and enrollments together
    Promise.all([
      fetch("/api/courses").then(r => r.json()),
      fetch("/api/enrollments").then(r => r.json()),
    ]).then(([coursesData, enrollmentsData]) => {
      if (coursesData.success) setCourses(coursesData.data.courses)
      if (enrollmentsData.success) {
        setMyEnrollments(enrollmentsData.data)
        // Calculate stats
        const activeEnrollments = enrollmentsData.data.filter((e: any) => e.status === "active")
        const hasFreelancing = activeEnrollments.some((e: any) => 
          e.course?.category?.slug === "freelancing"
        )
        setEnrollmentStats({
          totalEnrolled: activeEnrollments.length,
          maxCourses: 3,
          hasFreelancing,
          canEnroll: activeEnrollments.length < 3,
        })
      }
      setLoading(false)
    })
  }, [])

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  async function handleEnroll(courseId: string) {
    setEnrolling(courseId)
    setMessage("")
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage(data.message || "Enrolled successfully!")
        // Refresh enrollments
        const enrollRes = await fetch("/api/enrollments")
        const enrollData = await enrollRes.json()
        if (enrollData.success) {
          setMyEnrollments(enrollData.data)
          const activeEnrollments = enrollData.data.filter((e: any) => e.status === "active")
          const hasFreelancing = activeEnrollments.some((e: any) => 
            e.course?.category?.slug === "freelancing"
          )
          setEnrollmentStats({
            totalEnrolled: activeEnrollments.length,
            maxCourses: 3,
            hasFreelancing,
            canEnroll: activeEnrollments.length < 3,
          })
        }
      } else {
        setMessage(data.error?.message || "Failed to enroll")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setEnrolling(null)
    }
  }

  const isEnrolled = (courseId: string) => myEnrollments.some((e) => e.courseId === courseId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Courses</h1>
        <p className="text-gray-500">Discover free courses to build your skills</p>
      </div>

      {/* Enrollment Status Banner */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Enrolled: </span>
              <span className="font-semibold text-[#0B6623]">{enrollmentStats.totalEnrolled}/{enrollmentStats.maxCourses}</span>
            </div>
            {enrollmentStats.hasFreelancing && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Freelancing ✓
              </span>
            )}
            {!enrollmentStats.hasFreelancing && enrollmentStats.totalEnrolled > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Freelancing Required
              </span>
            )}
          </div>
          {!enrollmentStats.canEnroll && (
            <span className="text-sm text-red-600 font-medium flex items-center gap-1">
              <Lock className="w-4 h-4" /> Batch Full - Max courses reached
            </span>
          )}
        </div>
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#0B6623] h-2 rounded-full transition-all"
              style={{ width: `${(enrollmentStats.totalEnrolled / enrollmentStats.maxCourses) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes("success") || message.includes("Enrolled") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {message}
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
          />
        </div>
        <button className="px-4 py-2.5 border rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const enrolled = isEnrolled(course.id)
            const isFreelancing = course.category?.slug === "freelancing"
            const canEnrollThis = enrollmentStats.canEnroll || enrolled
            
            return (
              <div key={course.id} className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow ${!canEnrollThis && !enrolled ? "opacity-75" : ""}`}>
                <div className="h-40 bg-gray-100 relative">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-[#0B6623] text-white text-xs px-2 py-1 rounded-full font-medium">
                    Free
                  </div>
                  {isFreelancing && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Compulsory
                    </div>
                  )}
                  {enrolled && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-green-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Enrolled
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {course.level}
                    </span>
                    <span className="text-xs text-gray-500">{course.language}</span>
                    {course.category && (
                      <span className="text-xs bg-[#0B6623]/10 text-[#0B6623] px-2 py-0.5 rounded-full">
                        {course.category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.shortDescription}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.durationHours}h
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {course.totalStudents || 0} students
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                        {course.instructor?.fullName?.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-600">{course.instructor?.fullName}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-center"
                    >
                      View Details
                    </Link>
                    {enrolled ? (
                      <Link
                        href={`/learn/${course.id}`}
                        className="flex-1 bg-[#0B6623] text-white py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 text-center"
                      >
                        Start Learning
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling === course.id || !canEnrollThis}
                        className="flex-1 bg-[#0B6623] text-white py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {enrolling === course.id ? (
                          <span className="animate-spin">...</span>
                        ) : !canEnrollThis ? (
                          <>
                            <Lock className="w-3 h-3" /> Limit Reached
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Enroll
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredCourses.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No courses found</p>
        </div>
      )}
    </div>
  )
}