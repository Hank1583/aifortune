import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

// ✅ 新增這行
import { AuthProvider } from "@/contexts/AuthContext"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "未來演算所",
  description: "結合五行八字，推演你的每日與未來運勢",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen`}
      >
        {/* ✅ 全站登入狀態從這裡開始 */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
