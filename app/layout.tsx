import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata, Viewport } from "next"
import WebLoginOverlay from "@/components/auth/WebLoginOverlay"
import { AuthProvider } from "@/contexts/AuthContext"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "AI Fortune",
  description: "AI 運勢與個人命盤服務",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        <AuthProvider>
          {children}
          <WebLoginOverlay />
        </AuthProvider>
      </body>
    </html>
  )
}
