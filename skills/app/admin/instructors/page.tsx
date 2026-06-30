"use client"

import { useEffect, useState } from "react"
import { Search, GraduationCap, CheckCircle, XCircle, Mail, Phone, MapPin, Award, User, Plus, Trash2, KeyRound } from "lucide-react"

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  
  // Add instructor modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addFormData, setAddFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    city: "",
    expertise: "",
    experienceYears: "",
  })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")

  useEffect(() => {
    fetchInstructors()
  }, [])

  async function fetchInstructors() {
    const res = await fetch("/api/admin/instructors")
    const data = await res.json()
    if (data.success) {
      setInstructors(data.data)
      setLoading(false)
    }
  }

  async function handleAddInstructor(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    setAddError("")

    try {
      const res = await fetch("/api/admin/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addFormData,
          expertise: addFormData.expertise.split(",").map((s: string) => s.trim()),
          experienceYears: parseInt(addFormData.experienceYears) || 0,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setInstructors([data.data, ...instructors])
        setShowAddModal(false)
        setAddFormData({
          fullName: "",
          email: "",
          username: "",
          password: "",
          phone: "",
          city: "",
          expertise: "",
          experienceYears: "",
        })
      } else {
        setAddError(data.error?.message || "Failed to add instructor")
      }
    } catch {
      setAddError("Something went wrong")
    } finally {
      setAddLoading(false)
    }
  }

  async function handleDelete(instructorId: string) {
    if (!confirm("Are you sure you want to delete this instructor?")) return
    
    setActionId(instructorId)
    try {
      const res = await fetch(`/api/admin/instructors/${instructorId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        setInstructors(instructors.filter((i) => i.id !== instructorId))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  const filteredInstructors = instructors.filter((inst) => {
    const matchesSearch = inst.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      inst.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      inst.user?.username?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || 
      (filter === "verified" && inst.isVerified) ||
      (filter === "pending" && !inst.isVerified)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
          <p className="text-gray-500">Manage instructors and their credentials</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#0B6623] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Instructor
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search instructors..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none bg-white"
        >
          <option value="all">All</option>
          <option value="pending">Pending Verification</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      {/* Add Instructor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Add New Instructor</h2>
              <p className="text-gray-500 text-sm mt-1">Create instructor account with login credentials</p>
            </div>
            
            <form onSubmit={handleAddInstructor} className="p-6 space-y-4">
              {addError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={addFormData.fullName}
                    onChange={(e) => setAddFormData({ ...addFormData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={addFormData.username}
                      onChange={(e) => setAddFormData({ ...addFormData, username: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                      placeholder="instructor_ahmed"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={addFormData.password}
                      onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                      placeholder="Min 6 characters"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={addFormData.city}
                    onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expertise (comma separated)</label>
                <input
                  type="text"
                  value={addFormData.expertise}
                  onChange={(e) => setAddFormData({ ...addFormData, expertise: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                  placeholder="Mathematics, Physics, Chemistry"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  value={addFormData.experienceYears}
                  onChange={(e) => setAddFormData({ ...addFormData, experienceYears: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                  placeholder="5"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 bg-[#0B6623] text-white py-2.5 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50"
                >
                  {addLoading ? "Adding..." : "Add Instructor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredInstructors.map((instructor) => (
          <div key={instructor.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-xl font-medium">
                  {instructor.user?.fullName?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{instructor.user?.fullName}</h3>
                    {instructor.isVerified ? (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> @{instructor.user?.username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {instructor.user?.email}
                    </span>
                    {instructor.user?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {instructor.user?.phone}
                      </span>
                    )}
                    {instructor.user?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {instructor.user?.city}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {instructor.expertise && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Expertise:</span> {Array.isArray(instructor.expertise) ? instructor.expertise.join(", ") : instructor.expertise}
                      </p>
                    )}
                    {instructor.experienceYears && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Experience:</span> {instructor.experienceYears} years
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(instructor.id)}
                  disabled={actionId === instructor.id}
                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredInstructors.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No instructors found</p>
          </div>
        )}
      </div>
    </div>
  )
}