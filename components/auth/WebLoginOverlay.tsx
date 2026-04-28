"use client"

import { FormEvent, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function WebLoginOverlay() {
  const {
    entryMode,
    isLogin,
    isLoginOpen,
    closeLogin,
    setEntryMode,
    loginWithWeb,
    loginError,
  } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (entryMode !== "web" || isLogin || !isLoginOpen) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setLocalError(null)

    try {
      await loginWithWeb({ email, password })
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "登入失敗，請稍後再試")
    } finally {
      setSubmitting(false)
    }
  }

  const errorMessage = localError ?? loginError

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">登入</div>
          </div>
          <button
            type="button"
            onClick={closeLogin}
            className="min-w-20 rounded-full border border-white/10 px-5 py-1.5 text-sm text-white/70 transition hover:text-white"
          >
            關閉
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-white/70">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-cyan-300/50"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-white/70">密碼</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-cyan-300/50"
              placeholder="請輸入密碼"
              required
            />
          </label>

          {errorMessage && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-cyan-300/85 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "登入中..." : "登入"}
          </button>
        </form>

        <div className="mt-5 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setEntryMode("line")}
            className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:bg-white/5"
          >
            改用 LINE 登入
          </button>
        </div>
      </div>
    </div>
  )
}
