"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Clock, TrendingUp, ArrowRight, PlayCircle, Award, AlertTriangle } from "lucide-react"

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [batchInfo, setBatchInfo] = useState({
    totalEnrolled: 0,
    maxCourses: 3,
    hasFreelancing: false,
    isComplete: false,
  })

  useEffect(() => {
    fetch("/api/enrollments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEnrollments(data.data)
          const active = data.data.filter((e: any) => e.status === "active")
          const hasFreelancing = active.some((e: any) => 
            e.course?.category?.slug === "freelancing"
          )
          setBatchInfo({
            totalEnrolled: active.length,
            maxCourses: 3,
            hasFreelancing,
            isComplete: active.length === 3 && hasFreelancing,
          })
        }
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <div className="grid sm:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-500">Continue learning from where you left off</p>
      </div>

      {/* Batch Status Card */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Current Batch Status</h3>
            <p className="text-sm text-gray-500">Batch Progress: {batchInfo.totalEnrolled}/{batchInfo.maxCourses} courses</p>
          </div>
          {batchInfo.isComplete ? (
            <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
              <Award className="w-4 h-4" /> Batch Complete
            </span>
          ) : (
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> In Progress
            </span>
          )}
        </div>
        <div className="bg-gray-200 rounded-full h-3 mb-3">
          <div
            className="bg-[#0B6623] h-3 rounded-full transition-all"
            style={{ width: `${(batchInfo.totalEnrolled / batchInfo.maxCourses) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-4 text-sm">
          {!batchInfo.hasFreelancing && (
            <span className="text-yellow-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Freelancing course is compulsory
            </span>
          )}
          {batchInfo.hasFreelancing && (
            <span className="text-green-600 flex items-center gap-1">
              <Award className="w-3 h-3" /> Freelancing enrolled ✓
            </span>
          )}
          {batchInfo.totalEnrolled < 3 && (
            <Link href="/courses" className="text-[#0B6623] font-medium hover:underline">
              Enroll in more courses →
            </Link>
          )}
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses enrolled yet</h3>
          <p className="text-gray-500 mb-6">Start your learning journey by enrolling in a course</p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-[#0B6623] text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90"
          >
            Browse Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gray-100 relative">
                {enrollment.course?.thumbnailUrl ? (
                  <img src={enrollment.course.thumbnailUrl} alt={enrollment.course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs px-2 py-1 rounded-full font-medium">
                  {enrollment.status === "completed" ? "Completed" : "In Progress"}
                </div>
                {enrollment.course?.category?.slug === "freelancing" && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Compulsory
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{enrollment.course?.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                    {enrollment.course?.instructor?.fullName?.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-600">{enrollment.course?.instructor?.fullName}</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{enrollment.progressPercent}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#0B6623] h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {enrollment.progressPercent}% done
                  </div>
                </div>
                <Link
                  href={`/learn/${enrollment.course?.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-[#0B6623] text-white py-2.5 rounded-lg font-medium hover:bg-opacity-90"
                >
                  <PlayCircle className="w-4 h-4" />
                  {enrollment.progressPercent > 0 ? "Continue Learning" : "Start Course"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}