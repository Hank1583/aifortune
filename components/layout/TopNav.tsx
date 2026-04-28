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
  const { isLogin } = useAuth()

  const tabs: [TabKey, string][] = isLogin
    ? [
        ["wuxing", "今日五行"],
        ["fortune", "今日運勢"],
        ["calendar", "日曆"],
        ["month", "月曆"],
        ["profile", "個人資料"],
      ]
    : [["wuxing", "今日五行"]]

  return (
    <div className="absolute top-6 left-1/2 z-20 -translate-x-1/2">
      <div className="flex flex-wrap items-center justify-center gap-8 rounded-full bg-white/10 px-8 py-3 backdrop-blur-md">
        {tabs.map(([key, label]) => {
          const isActive = active === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`whitespace-nowrap text-sm transition ${
                isActive
                  ? "font-semibold text-white"
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
