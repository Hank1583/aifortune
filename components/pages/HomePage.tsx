"use client"
import { useAuth } from '@/contexts/AuthContext'
import React, { useEffect, useState } from 'react'
import { useFortuneData }from "@/components/data/HomePage"
/* =========================
   Types / Constants
========================= */
type TabKey = "wuxing" | "fortune" | "calendar" | "month" | "profile"
type WuxingKey = "木" | "火" | "土" | "金" | "水"
type WuxingItem = {
  key: WuxingKey
  value: number
}

const WUXING_LIST: WuxingKey[] = ["木", "火", "土", "金", "水"]
const WUXING_COLOR: Record<WuxingKey, string> = {
  木: "bg-green-400",
  火: "bg-red-400",
  土: "bg-yellow-400",
  金: "bg-gray-300",
  水: "bg-blue-400",
}

type ProfiledHintProps = {
  title: string
  actionText: string
  onChange: () => void
}

/* =========================
   Helpers
========================= */

function trendArrow(dir: "up" | "down" | "flat") {
  return dir === "up" ? "↑" : dir === "down" ? "↓" : "→"
}

function statusLabel(v: number) {
  if (v >= 4) return { text: "偏旺", tone: "good" as const }
  if (v === 3) return { text: "平衡", tone: "neutral" as const }
  if (v === 2) return { text: "偏低", tone: "warn" as const }
  return { text: "弱", tone: "danger" as const }
}

function toneClass(tone: "good" | "neutral" | "warn" | "danger") {
  return {
    good: "text-emerald-300",
    neutral: "text-white/70",
    warn: "text-yellow-300",
    danger: "text-red-300",
  }[tone]
}

/* =========================
   Main Page
========================= */

export default function FortuneHome() {
  const { data, isLoading, error } = useFortuneData()
  const { member, loading: authLoading, lineUid} = useAuth()
  const [showTrendDetail, setShowTrendDetail] = useState(false)
  const [activeWuxing, setActiveWuxing] = useState<WuxingKey>(WUXING_LIST[0])

  useEffect(() => {
    if (data?.today?.dominant) {
      setActiveWuxing(data.today.dominant)
    }
  }, [data])

    if (authLoading) {
    return (
      <div className="px-4 py-4 text-white">
        登入驗證中…
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="px-4 py-4 text-white">
        運勢計算中…
      </div>
    )
  }

  if (!data || !data.today) {
    return (
      <div className="px-4 py-4 text-white">
        今日運勢尚未產生
      </div>
    )
  }

  return (
    <div className="px-4 py-4 text-white space-y-4">
      {/* ===== 今日五行（所有人可看） ===== */}
      <SectionCard>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">📅 今日五行</h2>
            <p className="text-sm text-white/60">
              {data.today.date}｜{data.today.ganzhi}
            </p>
          </div>

          <div className="text-right text-sm text-white/70">
            <div>趨勢 {trendArrow(data.today.trendDirection)}</div>
            <div>
              主導 <span className="text-white font-medium">{data.today.dominant}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-sm">
          {data.today.summary}
        </div>

        <div className="mt-4 space-y-3">
          {data.today.wuxing.map((w: WuxingItem) => (
            <WuxingRow key={w.key} label={w.key} value={w.value} />
          ))}
        </div>
      </SectionCard>

      {/* ===== 登入後才可看 ===== */}
      {member == null ? (
        <LoginHint title="登入後可查看 7 日五行趨勢" lineUid={lineUid ?? ""} />
      ) : member.user_fortune_id === -1 ? (
        // 2️⃣ 已登入但沒命盤
          <button
            onClick={() => setShowTrendDetail((v) => !v)}
            className="w-full rounded-lg border border-white/15 py-2 text-sm text-white/75"
          >
            {showTrendDetail ? "收合 7 日趨勢" : "查看 7 日趨勢 →"}
          </button>
      ) : (
        <>
          <button
            onClick={() => setShowTrendDetail((v) => !v)}
            className="w-full rounded-lg border border-white/15 py-2 text-sm text-white/75"
          >
            {showTrendDetail ? "收合 7 日趨勢" : "查看 7 日趨勢 →"}
          </button>

          {showTrendDetail && (
            <SectionCard>
              {/* ⭐ 五行 Segmented Control */}
              <WuxingSegmented
                value={activeWuxing}
                onChange={setActiveWuxing}
              />

              {/* ⭐ 對應的 7 日 BAR */}
              <div className="mt-4">
                {activeWuxing && (
                  <SevenDayBar
                    wuxing={activeWuxing}
                    series={data.today.trend7ByWuxing[activeWuxing]}
                  />
                )}
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}

/* =========================
   UI Components
========================= */

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/5 px-4 py-4">{children}</div>
}

function WuxingRow({ label, value }: { label: WuxingKey; value: number }) {
  const s = statusLabel(value)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <div className="flex gap-2">
          <span>{label}</span>
          <span className={`text-xs ${toneClass(s.tone)}`}>{s.text}</span>
        </div>
        <span className="text-xs text-white/60">{value}/5</span>
      </div>
      <div className="h-2 bg-white/15 rounded">
        <div
          className={`h-2 rounded ${WUXING_COLOR[label]}`}
          style={{ width: `${value * 20}%` }}
        />
      </div>
    </div>
  )
}

function SevenDayBar({
  wuxing,
  series,
}: {
  wuxing: WuxingKey
  series: number[]
}) {
  const MAX = 5
  const CHART_HEIGHT = 112 // 對應 h-28

  return (
    <div className="rounded-2xl bg-white/5 px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">
          📊 {wuxing}・近 7 日能量
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-28">
        {/* 背景刻度 */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[5, 4, 3, 2, 1, 0].map((l) => (
            <div key={l} className="flex items-center gap-2">
              <span className="w-4 text-[10px] text-white/30">
                {l}
              </span>
              <div className="flex-1 border-t border-white/10" />
            </div>
          ))}
        </div>

        {/* BAR */}
        <div className="absolute inset-0 ml-6 flex items-end gap-2 z-10">
          {series.map((v, i) => {
            const isToday = i === 0
            const barHeight =
              v === 0 ? 3 : (v / MAX) * CHART_HEIGHT

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end"
              >
                {/* BAR 本體 */}
                <div
                  className={`w-full rounded-md ${
                    WUXING_COLOR[wuxing]
                  } ${
                    isToday
                      ? "opacity-100 ring-2 ring-white/80"
                      : "opacity-90"
                  }`}
                  style={{
                    height: `${barHeight}px`,
                  }}
                />

                {/* value */}
                <div
                  className={`mt-1 text-[10px] ${
                    isToday ? "text-white" : "text-white/50"
                  }`}
                >
                  {v}
                </div>

                {/* day */}
                <div className="text-[10px] text-white/40">
                  {isToday ? "今" : `+${i}`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Hint */}
      <div className="mt-3 text-xs text-white/50">
        今日 {wuxing} 能量為{" "}
        <span className="text-white font-medium">
          {series[0]}
        </span>{" "}
        / 5
      </div>
    </div>
  )
}

function LoginHint({ title, lineUid, }: { title: string ,lineUid: string }) {
  return (
    <div className="rounded-2xl bg-white/5 px-4 py-4 text-center">
      <div className="mb-2 text-white/80">🔒 {title}</div>

      <a
        href={`https://www.highlight.url.tw/ai_fortune/register.php?uid=${lineUid}`}
        // href="https://line.me/R/ti/p/@306rtpqm"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-lg bg-white/10 px-4 py-2 text-sm"
      >
        登入 / 註冊 →
      </a>
    </div>
  )
}

function ProfiledHint({
  title,
  actionText,
  onChange,
}: ProfiledHintProps) {
  return (
    <div className="rounded-2xl bg-white/5 px-4 py-6 text-center">
      <div className="mb-3 text-white/80 text-sm">
        🔒 {title}
      </div>

      <button
        onClick={onChange}   // ✅ 這裡其實可以更簡潔
        className="inline-block rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition"
      >
        {actionText}
      </button>
    </div>
  )
}

function WuxingSegmented({
  value,
  onChange,
}: {
  value: WuxingKey
  onChange: (v: WuxingKey) => void
}) {
  const index = WUXING_LIST.indexOf(value)
  const width = 100 / WUXING_LIST.length

  return (
    <div className="relative rounded-full bg-white/10 p-1">
      {/* sliding indicator */}
      <div
        className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out ${
          WUXING_COLOR[value]
        }`}
        style={{
          width: `${width}%`,
          left: `${index * width}%`,
        }}
      />

      <div className="relative z-10 flex">
        {WUXING_LIST.map((k) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`flex-1 py-1.5 text-sm font-medium transition ${
              value === k
                ? "text-black"
                : "text-white/70 hover:text-white"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}