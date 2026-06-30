"use client"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Naujawan Skills - Pakistan Naujawan Party",
  description: "Free skill development courses for Pakistani youth by Pakistan Naujawan Party",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white`}>{children}</body>
    </html>
  )
}