"use client"

import { useEffect, useState } from "react"
import { Save, Loader2, User, GraduationCap, Award, Briefcase } from "lucide-react"

export default function InstructorSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const [profile, setProfile] = useState({
    expertise: [] as string[],
    experienceYears: 0,
    bio: "",
    education: "",
  })

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile({
            expertise: data.user.expertise || [],
            experienceYears: data.user.experienceYears || 0,
            bio: data.user.bio || "",
            education: data.user.education || "",
          })
        }
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage("")
    
    try {
      const res = await fetch("/api/instructor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (data.success) {
        setMessage("Profile updated successfully!")
      } else {
        setMessage(data.error?.message || "Failed to update profile")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Instructor Settings</h1>
        <p className="text-gray-500">Manage your instructor profile</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.includes("success") ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-[#0B6623]" />
          <h2 className="font-semibold text-gray-900">Professional Information</h2>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Areas of Expertise</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {profile.expertise.map((skill, i) => (
              <span key={i} className="bg-[#0B6623]/10 text-[#0B6623] text-sm px-3 py-1 rounded-full flex items-center gap-1">
                {skill}
                <button
                  onClick={() => setProfile({ ...profile, expertise: profile.expertise.filter((_, idx) => idx !== i) })}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add expertise and press Enter"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                const value = e.currentTarget.value.trim()
                if (value && !profile.expertise.includes(value)) {
                  setProfile({ ...profile, expertise: [...profile.expertise, value] })
                  e.currentTarget.value = ""
                }
              }
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience</label>
          <input
            type="number"
            value={profile.experienceYears}
            onChange={(e) => setProfile({ ...profile, experienceYears: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
            min={0}
            max={50}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Education</label>
          <input
            type="text"
            value={profile.education}
            onChange={(e) => setProfile({ ...profile, education: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
            placeholder="e.g., Master's in Computer Science"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none resize-none"
            placeholder="Tell students about yourself..."
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#0B6623] text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-md"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}