"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Upload, ImageIcon, Loader2 } from "lucide-react"

interface Category {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  courseCount: number
  createdAt: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    thumbnailUrl: "",
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "categories")
      formData.append("width", "400")
      formData.append("height", "300")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setFormData(prev => ({ ...prev, thumbnailUrl: data.data.url }))
      }
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        setFormData({ name: "", description: "", thumbnailUrl: "" })
        setShowAddForm(false)
        fetchCategories()
      } else {
        alert(data.error?.message || "Failed to add category")
      }
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        fetchCategories()
      }
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/instructor/courses" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0B6623] transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500">Manage course categories</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-[#0B6623] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <h2 className="text-lg font-semibold">Add New Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none"
                placeholder="e.g., Digital Marketing"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B6623] focus:border-transparent outline-none resize-none"
                placeholder="Brief description of this category"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category Thumbnail *
                <span className="text-xs text-gray-400 font-normal ml-2">(Recommended: 400x300px, Max 2MB)</span>
              </label>
              
              {formData.thumbnailUrl ? (
                <div className="relative w-fit">
                  <img 
                    src={formData.thumbnailUrl} 
                    alt="Preview" 
                    className="w-48 h-36 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thumbnailUrl: "" })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#0B6623] transition-colors cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <Loader2 className="w-8 h-8 mx-auto mb-3 text-gray-400 animate-spin" />
                  ) : (
                    <ImageIcon className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  )}
                  <p className="text-sm text-gray-600 font-medium">
                    {uploading ? "Uploading..." : "Click to upload thumbnail"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">400x300px recommended, PNG/JPG up to 2MB</p>
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name || !formData.thumbnailUrl || uploading}
                className="px-6 py-3 bg-[#0B6623] text-white rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50"
              >
                Add Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
          <p className="text-gray-500">Add categories to organize your courses</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gray-100 relative">
                {category.thumbnailUrl ? (
                  <img 
                    src={category.thumbnailUrl} 
                    alt={category.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{category.courseCount || 0} courses</span>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}