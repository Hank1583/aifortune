"use client"

import React, { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useFortuneData } from "@/components/data/HomePage"

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

function trendArrow(direction: "up" | "down" | "flat") {
  if (direction === "up") return "↗"
  if (direction === "down") return "↘"
  return "→"
}

function statusLabel(value: number) {
  if (value >= 4) return { text: "旺", tone: "good" as const }
  if (value === 3) return { text: "平穩", tone: "neutral" as const }
  if (value === 2) return { text: "偏弱", tone: "warn" as const }
  return { text: "低", tone: "danger" as const }
}

function toneClass(tone: "good" | "neutral" | "warn" | "danger") {
  return {
    good: "text-emerald-300",
    neutral: "text-white/70",
    warn: "text-yellow-300",
    danger: "text-red-300",
  }[tone]
}

export default function FortuneHome() {
  const { data, isLoading } = useFortuneData()
  const { member, loading: authLoading, lineUid, openLogin } = useAuth()
  const [showTrendDetail, setShowTrendDetail] = useState(false)
  const [activeWuxing, setActiveWuxing] = useState<WuxingKey | null>(null)

  if (authLoading) {
    return <div className="px-4 py-4 text-white">登入狀態載入中...</div>
  }

  if (isLoading) {
    return <div className="px-4 py-4 text-white">運勢資料載入中...</div>
  }

  if (!data?.today) {
    return <div className="px-4 py-4 text-white">目前沒有可顯示的五行資料</div>
  }

  const currentWuxing = activeWuxing ?? (data.today.dominant as WuxingKey)

  return (
    <div className="space-y-4 px-4 py-4 text-white">
      <SectionCard>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">今日五行能量</h2>
            <p className="text-sm text-white/60">
              {data.today.date} | {data.today.ganzhi}
            </p>
          </div>

          <div className="text-right text-sm text-white/70">
            <div>趨勢 {trendArrow(data.today.trendDirection)}</div>
            <div>
              主運 <span className="font-medium text-white">{data.today.dominant}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-sm">
          {data.today.summary}
        </div>

        <div className="mt-4 space-y-3">
          {data.today.wuxing.map((item: WuxingItem) => (
            <WuxingRow key={item.key} label={item.key} value={item.value} />
          ))}
        </div>
      </SectionCard>

      {member == null ? (
        <LoginHint
          title="註冊或登入後可查看 7 日五行趨勢"
          lineUid={lineUid ?? ""}
          onOpenLogin={openLogin}
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setShowTrendDetail((value) => !value)}
            className="w-full rounded-lg border border-white/15 py-2 text-sm text-white/75"
          >
            {showTrendDetail ? "收起 7 日趨勢" : "查看 7 日趨勢"}
          </button>

          {showTrendDetail && (
            <SectionCard>
              <WuxingSegmented value={currentWuxing} onChange={setActiveWuxing} />

              <div className="mt-4">
                <SevenDayBar
                  wuxing={currentWuxing}
                  series={data.today.trend7ByWuxing[currentWuxing]}
                />
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/5 px-4 py-4">{children}</div>
}

function WuxingRow({ label, value }: { label: WuxingKey; value: number }) {
  const status = statusLabel(value)

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <div className="flex gap-2">
          <span>{label}</span>
          <span className={`text-xs ${toneClass(status.tone)}`}>{status.text}</span>
        </div>
        <span className="text-xs text-white/60">{value}/5</span>
      </div>

      <div className="h-2 rounded bg-white/15">
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
  const max = 5
  const chartHeight = 112

  return (
    <div className="rounded-2xl bg-white/5 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">{wuxing} 未來 7 日走勢</div>
      </div>

      <div className="relative h-28">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[5, 4, 3, 2, 1, 0].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-4 text-[10px] text-white/30">{label}</span>
              <div className="flex-1 border-t border-white/10" />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 z-10 ml-6 flex items-end gap-2">
          {series.map((value, index) => {
            const isToday = index === 0
            const barHeight = value === 0 ? 3 : (value / max) * chartHeight

            return (
              <div
                key={`${wuxing}-${index}`}
                className="flex flex-1 flex-col items-center justify-end"
              >
                <div
                  className={`w-full rounded-md ${WUXING_COLOR[wuxing]} ${
                    isToday ? "opacity-100 ring-2 ring-white/80" : "opacity-90"
                  }`}
                  style={{ height: `${barHeight}px` }}
                />

                <div
                  className={`mt-1 text-[10px] ${
                    isToday ? "text-white" : "text-white/50"
                  }`}
                >
                  {value}
                </div>

                <div className="text-[10px] text-white/40">
                  {isToday ? "今日" : `+${index}`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-3 text-xs text-white/50">
        今日 {wuxing} 分數為 <span className="font-medium text-white">{series[0] ?? 0}</span> / 5
      </div>
    </div>
  )
}

function LoginHint({
  title,
  lineUid,
  onOpenLogin,
}: {
  title: string
  lineUid: string
  onOpenLogin: () => void
}) {
  return (
    <div className="rounded-2xl bg-white/5 px-4 py-4 text-center">
      <div className="mb-3 text-white/80">{title}</div>

      <div className="flex items-center justify-center gap-3">
        <a
          href={`https://www.highlight.url.tw/ai_fortune/register.php?uid=${lineUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-lg bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15"
        >
          註冊
        </a>

        <button
          type="button"
          onClick={onOpenLogin}
          className="inline-flex rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
        >
          登入
        </button>
      </div>
    </div>
  )
}

function WuxingSegmented({
  value,
  onChange,
}: {
  value: WuxingKey
  onChange: (nextValue: WuxingKey) => void
}) {
  const index = WUXING_LIST.indexOf(value)
  const width = 100 / WUXING_LIST.length

  return (
    <div className="relative rounded-full bg-white/10 p-1">
      <div
        className={`absolute bottom-1 top-1 rounded-full transition-all duration-300 ease-out ${WUXING_COLOR[value]}`}
        style={{
          width: `${width}%`,
          left: `${index * width}%`,
        }}
      />

      <div className="relative z-10 flex">
        {WUXING_LIST.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex-1 py-1.5 text-sm font-medium transition ${
              value === key ? "text-black" : "text-white/70 hover:text-white"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}
