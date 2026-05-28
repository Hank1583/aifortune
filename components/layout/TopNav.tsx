"use client"

import { useAuth } from "@/contexts/AuthContext"

type TabKey = "wuxing" | "fortune" | "calendar" | "month" | "profile"

export default function TopNav({
  active,
  hasProfile,
  onChange,
}: {
  active: TabKey
  hasProfile?: boolean | null
  onChange: (key: TabKey) => void
}) {
  const { isLogin } = useAuth()

  const tabs: [TabKey, string][] = !isLogin
    ? [["wuxing", "今日五行"]]
    : hasProfile !== true
      ? [["profile", "建立命盤"]]
      : [
          ["wuxing", "今日五行"],
          ["fortune", "今日運勢"],
          ["calendar", "日曆"],
          ["month", "月曆"],
          ["profile", "個人資料"],
        ]

  return (
    <div className="absolute left-1/2 top-4 z-20 w-[calc(100vw-24px)] max-w-max -translate-x-1/2 sm:top-6">
      <div className="flex w-full items-center gap-4 overflow-x-auto rounded-full bg-white/10 px-4 py-3 backdrop-blur-md sm:justify-center sm:gap-8 sm:px-8">
        {tabs.map(([key, label]) => {
          const isActive = active === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`shrink-0 whitespace-nowrap text-sm transition ${
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
