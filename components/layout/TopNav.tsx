"use client"

import { useAuth } from "@/contexts/AuthContext"

type TabKey = "wuxing" | "fortune" | "calendar" | "month" | "profile"

export default function TopNav({
  active,
  onChange,
}: {
  active: TabKey
  onChange: (key: TabKey) => void
}) {
  const { isLogin, openLogin } = useAuth()

  // 🔧【開發用】強制登入（需要時才打開）
  const DEV_FORCE_LOGIN = false
  const loginState = DEV_FORCE_LOGIN ? true : isLogin

  const tabs: [TabKey, string][] = loginState
    ? [
        ["wuxing", "今日五行"],
        ["fortune", "每日運勢"],
        ["calendar", "日曆"],
        ["month", "月曆"],
        ["profile", "個人資料"],
      ]
    : [
        ["wuxing", "今日五行"],
      ]

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-8 px-8 py-3 rounded-full bg-white/10 backdrop-blur-md">
        {/* Tabs */}
        {tabs.map(([key, label]) => {
          const isActive = active === key

          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`whitespace-nowrap text-sm transition ${
                isActive
                  ? "text-white font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
