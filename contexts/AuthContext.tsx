"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { getIdToken, initLiff, isLoggedIn } from "@/lib/liff"

type Plan = "free" | "vip"
type EntryMode = "auto" | "line" | "web"

type Member = {
  member_id: number
  email: string
  name: string
  role?: string
  app_id: string
  subscription: Plan
  avatar?: string
  expire_date?: string | null
  user_fortune_id?: number
}

type WebLoginForm = {
  email: string
  password: string
}

type AuthContextType = {
  isLogin: boolean
  loading: boolean
  member: Member | null
  plan: Plan
  isPaid: boolean
  openLogin: () => void
  closeLogin: () => void
  isLoginOpen: boolean
  lineUid: string | null
  logout: () => void
  entryMode: Exclude<EntryMode, "auto">
  setEntryMode: (mode: Exclude<EntryMode, "auto">) => void
  loginError: string | null
  loginWithWeb: (form: WebLoginForm) => Promise<void>
  updateMember: (patch: Partial<Member>) => void
  isAdmin: boolean
  viewUid: string | null
  effectiveMemberId: string | null
  isViewingAsAdmin: boolean
  setViewUid: (uid: string) => void
  clearViewUid: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const MEMBER_STORAGE_KEY = "member"
const ENTRY_MODE_STORAGE_KEY = "entry_mode"
const DEFAULT_APP_ID = "ai_fortune"
const WEB_LOGIN_APP_ID = "ai_fortune"
const WEB_LOGIN_ENDPOINT = "https://www.highlight.url.tw/api/login.php"

function resolveEntryMode(search: string): EntryMode {
  const params = new URLSearchParams(search)
  const entry = params.get("entry")

  if (entry === "line" || entry === "web") return entry
  return "auto"
}

function detectRuntimeEntryMode(mode: EntryMode): "line" | "web" {
  if (mode === "line" || mode === "web") return mode
  if (typeof window === "undefined") return "web"

  const ua = window.navigator.userAgent.toLowerCase()
  return ua.includes(" line/") ? "line" : "web"
}

function normalizeMember(raw: unknown): Member | null {
  if (!raw || typeof raw !== "object") return null

  const data = raw as Record<string, unknown>
  if (typeof data.member_id !== "number") return null
  if (typeof data.subscription !== "string") return null

  return {
    member_id: data.member_id,
    email: typeof data.email === "string" ? data.email : "",
    name: typeof data.name === "string" ? data.name : "",
    role: typeof data.role === "string" ? data.role : undefined,
    app_id: typeof data.app_id === "string" ? data.app_id : DEFAULT_APP_ID,
    subscription: data.subscription === "vip" ? "vip" : "free",
    avatar: typeof data.avatar === "string" ? data.avatar : undefined,
    expire_date:
      typeof data.expire_date === "string" ? data.expire_date : null,
    user_fortune_id:
      typeof data.user_fortune_id === "number" ? data.user_fortune_id : undefined,
  }
}

function readViewUidFromSearch(search: string) {
  const params = new URLSearchParams(search)
  const value = params.get("view_uid")
  return value && value.trim() ? value.trim() : null
}

function persistViewUid(viewUid: string | null) {
  const url = new URL(window.location.href)
  if (viewUid) {
    url.searchParams.set("view_uid", viewUid)
  } else {
    url.searchParams.delete("view_uid")
  }
  window.history.replaceState({}, "", url)
}

function persistEntryMode(mode: "line" | "web") {
  localStorage.setItem(ENTRY_MODE_STORAGE_KEY, mode)

  const url = new URL(window.location.href)
  url.searchParams.set("entry", mode)
  window.history.replaceState({}, "", url)
}

function persistMember(member: Member | null) {
  if (!member) {
    localStorage.removeItem(MEMBER_STORAGE_KEY)
    return
  }

  localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(member))
}

async function loginWithLineUid(lineUid: string): Promise<Member | null> {
  const formData = new FormData()
  formData.append("app_id", DEFAULT_APP_ID)
  formData.append("line_uid", lineUid)

  const res = await fetch("https://www.highlight.url.tw/api/login_line.php", {
    method: "POST",
    body: formData,
  })
  const data = await res.json()

  if (data.status !== "success") return null

  return {
    member_id: data.member_id,
    email: data.email,
    name: data.name,
    role: typeof data.role === "string" ? data.role : undefined,
    app_id: data.app_id,
    subscription: data.subscription,
    avatar: data.avatar,
    expire_date: data.expire_date,
    user_fortune_id: data.user_fortune_id,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLogin, setIsLogin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<Member | null>(null)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [lineUid, setLineUid] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [entryMode, setEntryModeState] = useState<"line" | "web">("web")
  const [viewUid, setViewUidState] = useState<string | null>(null)

  useEffect(() => {
    const preferred = resolveEntryMode(window.location.search)
    const storedMode = localStorage.getItem(ENTRY_MODE_STORAGE_KEY)
    const nextMode = detectRuntimeEntryMode(
      preferred !== "auto"
        ? preferred
        : storedMode === "line" || storedMode === "web"
          ? storedMode
          : "auto"
    )

    setEntryModeState(nextMode)

    const storedMember = normalizeMember(
      JSON.parse(localStorage.getItem(MEMBER_STORAGE_KEY) ?? "null")
    )

    if (storedMember) {
      setMember(storedMember)
      setIsLogin(true)
    }

    const nextViewUid = readViewUidFromSearch(window.location.search)
    if (storedMember?.role === "admin" && nextViewUid) {
      setViewUidState(nextViewUid)
    }

    if (nextMode === "web") {
      if (!storedMember) {
        setIsLoginOpen(true)
      }
      setLoading(false)
      return
    }

    async function initLineAuth() {
      try {
        const liff = await initLiff()

        if (!isLoggedIn()) {
          liff.login()
          return
        }

        const idToken = getIdToken()
        if (!idToken) throw new Error("No LINE ID Token")

        const payload = JSON.parse(atob(idToken.split(".")[1]))
        const nextLineUid = payload.sub
        setLineUid(nextLineUid)

        const nextMember = await loginWithLineUid(nextLineUid)
        if (!nextMember) {
          setIsLogin(false)
          setMember(null)
          return
        }

        localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(nextMember))
        setMember(nextMember)
        setIsLogin(true)
      } catch (err) {
        console.error("Auth init error:", err)
        setIsLogin(false)
        setLoginError("LINE 登入失敗")
      } finally {
        setLoading(false)
      }
    }

    initLineAuth()
  }, [])

  const plan = useMemo<Plan>(() => member?.subscription ?? "free", [member])
  const isAdmin = member?.role === "admin"
  const isViewingAsAdmin = Boolean(isAdmin && viewUid)
  const effectiveMemberId = useMemo(() => {
    if (isViewingAsAdmin && viewUid) return viewUid
    if (!member?.member_id) return null
    return String(member.member_id)
  }, [isViewingAsAdmin, member?.member_id, viewUid])

  const logout = () => {
    localStorage.removeItem(MEMBER_STORAGE_KEY)
    setMember(null)
    setIsLogin(false)
    setLoginError(null)
    setViewUidState(null)
    persistViewUid(null)
    if (entryMode === "web") {
      setIsLoginOpen(true)
    }
  }

  const setEntryMode = (mode: "line" | "web") => {
    persistEntryMode(mode)
    setEntryModeState(mode)
    setLoginError(null)

    if (mode === "web") {
      setIsLoginOpen(true)
      return
    }

    window.location.reload()
  }

  const loginWithWeb = async ({ email, password }: WebLoginForm) => {
    setLoginError(null)

    const body = new URLSearchParams()
    body.set("email", email)
    body.set("password", password)
    body.set("app_id", WEB_LOGIN_APP_ID)

    const res = await fetch(WEB_LOGIN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })
    const data = await res.json()

    if (!res.ok || data.status !== "success") {
      throw new Error(data.message ?? "帳號或密碼錯誤")
    }

    const nextMember = normalizeMember({
      member_id: data.member_id,
      email: data.email,
      name: data.name,
      app_id: data.app_id,
      subscription: data.subscription,
      avatar: data.avatar,
      expire_date: data.expire_date,
      user_fortune_id: data.user_fortune_id,
      role: data.role
    })

    if (!nextMember) {
      throw new Error("登入成功，但會員資料格式不正確")
    }

    localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(nextMember))
    setMember(nextMember)
    setIsLogin(true)
    setIsLoginOpen(false)
  }

  const openLogin = () => {
    if (entryMode === "line") {
      const url = new URL(window.location.href)
      url.searchParams.set("entry", "line")
      window.location.href = url.toString()
      return
    }

    setIsLoginOpen(true)
  }

  const closeLogin = () => setIsLoginOpen(false)

  const updateMember = (patch: Partial<Member>) => {
    setMember((current) => {
      if (!current) return current
      const nextMember = { ...current, ...patch }
      persistMember(nextMember)
      return nextMember
    })
  }

  const setViewUid = (uid: string) => {
    const nextUid = uid.trim()
    if (!isAdmin || !nextUid) return
    setViewUidState(nextUid)
    persistViewUid(nextUid)
  }

  const clearViewUid = () => {
    setViewUidState(null)
    persistViewUid(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isLogin,
        loading,
        member,
        plan,
        isPaid: plan === "vip",
        isLoginOpen,
        openLogin,
        closeLogin,
        logout,
        lineUid,
        entryMode,
        setEntryMode,
        loginError,
        loginWithWeb,
        updateMember,
        isAdmin,
        viewUid,
        effectiveMemberId,
        isViewingAsAdmin,
        setViewUid,
        clearViewUid,
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
