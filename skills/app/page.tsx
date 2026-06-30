"use client"

import Link from "next/link"
import { BookOpen, Users, Award, TrendingUp, ArrowRight, CheckCircle, Play, Star, MapPin, Phone } from "lucide-react"

export default function HomePage() {
  const categories = [
    { name: "Digital Marketing", icon: "📈", count: 5, color: "bg-blue-50 text-blue-600" },
    { name: "Graphic Design", icon: "🎨", count: 3, color: "bg-purple-50 text-purple-600" },
    { name: "Web Development", icon: "💻", count: 4, color: "bg-orange-50 text-orange-600" },
    { name: "Freelancing", icon: "💼", count: 6, color: "bg-green-50 text-green-600" },
    { name: "E-Commerce", icon: "🛒", count: 3, color: "bg-pink-50 text-pink-600" },
    { name: "AI & Productivity", icon: "🤖", count: 2, color: "bg-indigo-50 text-indigo-600" },
  ]

  const features = [
    "100% Free Courses",
    "Expert Instructors", 
    "Video Lectures",
    "Practical Assignments",
    "Certificates",
    "Internship Opportunities",
  ]

  const stats = [
    { number: "10,000+", label: "Students Enrolled" },
    { number: "50+", label: "Free Courses" },
    { number: "100+", label: "Expert Instructors" },
    { number: "25+", label: "Partner Organizations" },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-pnp-green text-white py-2 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> +92-300-1234567
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Islamabad, Pakistan
            </span>
          </div>
          <span className="hidden sm:block">GROW PAKISTAN Initiative</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pnp-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">PNP</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-gray-900 block leading-tight">Naujawan Skills</span>
                <span className="text-xs text-pnp-green font-medium">by Pakistan Naujawan Party</span>
              </div>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/courses" className="text-gray-600 hover:text-pnp-green font-medium transition-colors">Courses</Link>
              <Link href="/login" className="text-gray-600 hover:text-pnp-green font-medium transition-colors">Login</Link>
              <Link href="/register" className="bg-pnp-green text-white px-5 py-2.5 rounded-lg font-medium hover:bg-pnp-green-dark transition-colors shadow-md hover:shadow-lg">
                Join Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-pnp-green/5 overflow-hidden">
        <div className="absolute inset-0 bg-pnp-green/10 opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-pnp-green/10 text-pnp-green px-4 py-2 rounded-full text-sm font-semibold">
                <Award className="w-4 h-4" />
                GROW PAKISTAN Initiative
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Learn Skills.<br />
                Build Future.<br />
                <span className="text-gradient">Grow Pakistan.</span>
              </h1>
              
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Free skill-based education for Pakistani youth. Learn Digital Marketing, 
                Graphic Design, Web Development, Freelancing and more — <span className="font-semibold text-pnp-green">absolutely free!</span>
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="bg-pnp-green text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-pnp-green-dark transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group">
                  Start Learning 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/courses" className="border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold hover:border-pnp-green hover:text-pnp-green transition-all flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Browse Courses
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                {[
                  { icon: Users, text: "10,000+ Students" },
                  { icon: BookOpen, text: "50+ Courses" },
                  { icon: Award, text: "Free Certificates" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <item.icon className="w-4 h-4 text-pnp-green" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Right Side - Featured Courses Preview */}
            <div className="hidden lg:block relative">
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-pnp-green/10 rounded-full blur-3xl"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-pnp-green rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Featured Courses</h3>
                    <p className="text-sm text-gray-500">Most popular this week</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { title: "Digital Marketing Masterclass", students: "2,341", rating: "4.9" },
                    { title: "Graphic Design with Canva", students: "1,892", rating: "4.8" },
                    { title: "Freelancing Essentials", students: "3,104", rating: "4.9" },
                  ].map((course, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-pnp-green/5 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 bg-pnp-green/20 rounded-lg flex items-center justify-center group-hover:bg-pnp-green group-hover:text-white transition-colors">
                        <Play className="w-4 h-4 text-pnp-green group-hover:text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{course.title}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>{course.students} students</span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            {course.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-pnp-green py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center text-white">
                <p className="text-3xl lg:text-4xl font-bold">{stat.number}</p>
                <p className="text-pnp-green-light text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-pnp-green font-semibold text-sm uppercase tracking-wider">Why Learn With Us</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3">Everything You Need to Succeed</h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Pakistan Naujawan Party is committed to empowering youth through free, quality education</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="w-12 h-12 bg-pnp-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-pnp-green" />
                </div>
                <span className="font-semibold text-gray-800">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-pnp-green font-semibold text-sm uppercase tracking-wider">Explore</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3">Course Categories</h2>
            <p className="text-gray-500 mt-4">Choose from a variety of skill-based courses</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <Link key={i} href={`/courses?category=${cat.name.toLowerCase().replace(" ", "-")}`}>
                <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg hover:border-pnp-green/20 transition-all group">
                  <div className={`w-14 h-14 ${cat.color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    {cat.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{cat.name}</h3>
                  <p className="text-gray-500 text-sm">{cat.count} Courses Available</p>
                  <div className="flex items-center gap-1 text-pnp-green text-sm font-medium mt-3 group-hover:gap-2 transition-all">
                    Explore <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-pnp-green to-pnp-green-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center text-white relative">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">Ready to Build Your Future?</h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of Pakistani youth learning skills for free. 
            No fees, no hidden charges — just quality education for a brighter Pakistan.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="bg-white text-pnp-green px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/courses" className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors">
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-pnp-dark text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pnp-green rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">PNP</span>
                </div>
                <div>
                  <span className="font-bold text-xl text-white block">Naujawan Skills</span>
                  <span className="text-xs text-pnp-green">by Pakistan Naujawan Party</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                Empowering Pakistani youth through free skill-based education. 
                A GROW PAKISTAN initiative by Pakistan Naujawan Party.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses" className="hover:text-white transition-colors">All Courses</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +92-300-1234567</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Islamabad, Pakistan</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm"> 2026 Pakistan Naujawan Party. All rights reserved.</p>
            <p className="text-sm">GROW PAKISTAN Initiative</p>
          </div>
        </div>
      </footer>
    </div>
  )
}