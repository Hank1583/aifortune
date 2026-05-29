import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import WebLoginOverlay from "@/components/auth/WebLoginOverlay"
import { AuthProvider } from "@/contexts/AuthContext"
import "./globals.css"

const GA_MEASUREMENT_ID = "G-NGY7LS38CS"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://aifortune.highlightsignal.com"),
  applicationName: "未來演算所",
  title: {
    default: "未來演算所",
    template: "%s｜未來演算所",
  },
  description:
    "以五行八字為基礎的演算系統，將傳統命理轉換成可理解的趨勢、風險與選擇建議。",
  keywords: [
    "未來演算所",
    "五行八字",
    "今日運勢",
    "月運勢",
    "年運勢",
    "命盤分析",
    "十神分析",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/",
    siteName: "未來演算所",
    title: "未來演算所",
    description:
      "以五行八字為基礎的演算系統，提供每日、每月與年度趨勢參考。",
  },
  twitter: {
    card: "summary",
    title: "未來演算所",
    description:
      "以五行八字為基礎的演算系統，提供每日、每月與年度趨勢參考。",
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
  },
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <AuthProvider>
          {children}
          <WebLoginOverlay />
        </AuthProvider>
      </body>
    </html>
  )
}
