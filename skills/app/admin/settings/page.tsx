"use client"

import { useState } from "react"
import { Save, Loader2, Globe, Mail, Bell, Shield, Database } from "lucide-react"

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const [settings, setSettings] = useState({
    siteName: "Naujawan Skills",
    siteDescription: "Free skill development courses for Pakistani youth",
    contactEmail: "admin@naujawanskills.pk",
    contactPhone: "+92-300-1234567",
    enableRegistration: true,
    enableCourseCreation: true,
    requireApproval: true,
    maintenanceMode: false,
  })

  async function handleSave() {
    setSaving(true)
    setMessage("")
    
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.success) {
        setMessage("Settings saved successfully!")
      } else {
        setMessage(data.error?.message || "Failed to save settings")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500">Configure global platform settings</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.includes("success") ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-[#0B6623]" />
            <h2 className="font-semibold text-gray-900">General Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-[#0B6623]" />
            <h2 className="font-semibold text-gray-900">Contact Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone</label>
              <input
                type="tel"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Platform Controls */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#0B6623]" />
            <h2 className="font-semibold text-gray-900">Platform Controls</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: "enableRegistration", label: "Enable User Registration", desc: "Allow new users to register" },
              { key: "enableCourseCreation", label: "Enable Course Creation", desc: "Allow instructors to create courses" },
              { key: "requireApproval", label: "Require Approval", desc: "Courses need admin approval before publishing" },
              { key: "maintenanceMode", label: "Maintenance Mode", desc: "Put site in maintenance mode" },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                <div>
                  <p className="font-medium text-sm text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative ${settings[item.key as keyof typeof settings] ? "bg-[#0B6623]" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-0.5"}`} />
                  <input
                    type="checkbox"
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                    className="sr-only"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#0B6623] text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-md"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}