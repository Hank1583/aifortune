"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { initLiff, getIdToken, isLoggedIn } from "@/lib/liff"

type Plan = "free" | "paid"

type Member = {
  member_id: number
  email: string
  name: string
  app_id: string
  subscription: Plan
  avatar?: string
  expire_date?: string | null
  user_fortune_id?: number
}

type AuthContextType = {
  isLogin: boolean
  loading: boolean

  // 👤 會員資料
  member: Member | null

  // 💳 方案
  plan: Plan
  isPaid: boolean

  // UI
  openLogin: () => void
  closeLogin: () => void
  isLoginOpen: boolean
  lineUid: string | null
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {

  /** 🔧 開發用（上線請設 false） */
  const DEV_FORCE_LOGIN = false

  const [isLogin, setIsLogin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<Member | null>(null)
  const [plan, setPlan] = useState<Plan>("free")
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [lineUid, setLineUid] = useState<string | null>(null)
  useEffect(() => {
    async function initAuth() {
      try {
        if (DEV_FORCE_LOGIN) {
          setIsLogin(true)
          setPlan("free")
          setLoading(false)
          return
        }

        const liff = await initLiff()

        if (!isLoggedIn()) {
          liff.login()
          return
        }

        /** 1️⃣ 取得 LINE ID Token */
        const idToken = getIdToken()
        if (!idToken) throw new Error("No LINE ID Token")

        /** 2️⃣ decode JWT 取 sub（前端可用、後端也會再驗） */
        const payload = JSON.parse(
          atob(idToken.split(".")[1])
        )
        const lineId = payload.sub

        // const lineId = "U06e1d5253a127b6f4ab5c3227f826b00"//Hank
        // const lineId = "U07fd76a4221d13488c687d995ed3a499"//Vera
        // const lineId = "ASDASDASDASD"//Test

        setLineUid(lineId)

        /** 3️⃣ 呼叫你的會員 API */
        const formData = new FormData()
        formData.append("app_id", "ai_fortune")
        formData.append("line_uid", lineId)
        const res = await fetch(
          "https://www.highlight.url.tw/api/login_line.php",
          {
            method: "POST",
            body: formData,
          }
        )
        const data = await res.json()

        if (data.status !== "success") {
          setIsLogin(false)
          setMember(null)
          setPlan("free")
          return
        }

        /** 4️⃣ 存會員資料 */
        const memberData: Member = {
          member_id: data.member_id,
          email: data.email,
          name: data.name,
          app_id: data.app_id,
          subscription: data.subscription,
          avatar: data.avatar,
          expire_date: data.expire_date,
          user_fortune_id:data.user_fortune_id
        }
        setMember(memberData)
        setPlan(data.subscription)
        setIsLogin(true)

        /** optional：存 localStorage */
        localStorage.setItem("member", JSON.stringify(memberData))

      } catch (err) {
        console.error("Auth init error:", err)
        setIsLogin(false)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem("member")
    setMember(null)
    setIsLogin(false)
    setPlan("free")
  }

  const openLogin = () => setIsLoginOpen(true)
  const closeLogin = () => setIsLoginOpen(false)

  return (
    <AuthContext.Provider
      value={{
        isLogin,
        loading,
        member,
        plan,
        isPaid: plan === "paid",
        isLoginOpen,
        openLogin,
        closeLogin,
        logout,
        lineUid
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
