"use client"
import ReactECharts from "echarts-for-react"
import React, { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  fetchDailyForMonth,
  type DailyFortune,
} from "@/components/data/CalendarView"
/* =========================
   日期工具
========================= */

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"]
const dailyCache: Record<string, Record<string, DailyFortune>> = {}
const pad2 = (n: number) => String(n).padStart(2, "0")
const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

const startOfMonth = (y: number, m: number) => new Date(y, m, 1)
const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1)

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
/* =========================
   UI helpers
========================= */

function scoreTone(v: number) {
  if (v >= 8.5) return "text-emerald-300"   // 強運
  if (v >= 7)   return "text-cyan-300"      // 偏強
  if (v >= 5.5) return "text-white/80"      // 穩定
  if (v >= 4.5) return "text-yellow-300"    // 偏弱
  return "text-red-400"                     // 低潮
}

function dotTone(v: number) {
  if (v >= 8.5) return "bg-emerald-400"   // 強運
  if (v >= 7)   return "bg-cyan-400"      // 偏強
  if (v >= 5.5) return "bg-white/50"      // 穩定
  if (v >= 4.5) return "bg-yellow-400"    // 偏弱
  return "bg-red-400"                     // 低潮
}

/* =========================
   Section（可折疊）
========================= */

function Section({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl bg-white/5 px-1 py-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between mb-3 text-left"
      >
        <div>
          <div className="text-lg font-semibold text-white">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-white/50 mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
        <div className="text-white/50 text-sm mt-1">
          {open ? "▲" : "▼"}
        </div>
      </button>

      {open && <div className="space-y-3">{children}</div>}
    </div>
  )
}

function FortuneCurveChart({
  data,
  maxPoint,
  onPickISO,
}: {
  data: Array<{ iso: string; day: number; score: number }>
  maxPoint?: { iso: string; day: number; score: number }
  onPickISO: (iso: string) => void
}) {
  const option = useMemo(() => {
    const days = data.map((d) => d.day)
    const scores = data.map((d) => d.score)

    return {
      backgroundColor: "transparent",
      grid: { left: 30, right: 15, top: 10, bottom: 30 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(20,20,20,0.95)",
        borderColor: "rgba(255,255,255,0.15)",
        textStyle: { color: "#fff" },
        valueFormatter: (v: any) => Number(v).toFixed(1),
      },
      xAxis: {
        type: "category",
        data: days,
        axisLabel: { color: "rgba(255,255,255,0.65)" },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 10,
        interval: 2,
        axisLabel: { color: "rgba(255,255,255,0.65)" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
      },

      // ✅ inside-only：手機捏合、桌機滾輪、拖曳平移
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
          zoomOnMouseWheel: true,
          moveOnMouseWheel: false,
          moveOnMouseMove: true,
          preventDefaultMouseMove: true,
        },
      ],

      series: [
        {
          type: "line",
          data: scores,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { width: 2, color: "rgba(255,255,255,0.9)" },
          itemStyle: { color: "rgba(255,255,255,0.9)" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(255,255,255,0.15)" },
                { offset: 1, color: "rgba(255,255,255,0.02)" },
              ],
            },
          },
          // ✅ 標記最高點（綠色）
          markLine: maxPoint
            ? {
                symbol: "none",
                lineStyle: { color: "rgba(16,185,129,0.5)", width: 1 },
                label: { show: false },
                data: [{ xAxis: maxPoint.day-1 }],
              }
            : undefined,
        },
      ],
    }
  }, [data, maxPoint])

  const onEvents = useMemo(
    () => ({
      click: (params: any) => {
        const idx = params?.dataIndex
        const iso = data[idx]?.iso
        if (iso) onPickISO(iso)
      },
    }),
    [data, onPickISO]
  )

  if (!data?.length) return null

  return (
    <div className="w-full h-[260px] touch-none">
      <ReactECharts
        option={option}
        onEvents={onEvents}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  )
}

/* =========================
   Page
========================= */

export default function CalendarView() {
  const {
    member,
    loading: authLoading,
    isPaid,
    openLogin,
    effectiveMemberId,
  } = useAuth()

  const uid = effectiveMemberId ?? "guest"

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [cursorMonth, setCursorMonth] = useState(
    startOfMonth(today.getFullYear(), today.getMonth())
  )
  const [selectedISO, setSelectedISO] = useState(toISO(today))

  const [monthData, setMonthData] = useState<Record<string, DailyFortune>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  const year = cursorMonth.getFullYear()
  const month = cursorMonth.getMonth()
  const ym = `${year}-${pad2(month + 1)}`
  /* ===== 抓 API ===== */
  useEffect(() => {
    if (authLoading || !uid) return

    const cacheKey = `${uid}-${ym}`

    if (dailyCache[cacheKey]) {
      setMonthData(dailyCache[cacheKey])
      setLoading(false)
      return
    }

    setLoading(true)
    fetchDailyForMonth(uid, ym)
      .then((m) => {
        setMonthData(m)
        dailyCache[cacheKey] = m
      })
      .finally(() => setLoading(false))
  }, [authLoading, uid, ym])

  /* ===== 日曆格子 ===== */
  const cells = useMemo(() => {
    const first = startOfMonth(year, month)
    const firstWeekday = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const arr: Array<{ iso?: string; date?: Date }> = []
    for (let i = 0; i < firstWeekday; i++) arr.push({})
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      arr.push({ iso: toISO(date), date })
    }
    while (arr.length % 7 !== 0) arr.push({})
    return arr
  }, [year, month])

  const selected = monthData[selectedISO]

  // 你要畫哪個分數（預設財運）
  const [curveKey, setCurveKey] = useState<
    "overall" | "wealth" | "work" | "investment" | "social"
  >("wealth")

  const curveData = useMemo(() => {
    // monthData: Record<iso, DailyFortune>
    const rows = Object.values(monthData)
      .map((d) => ({
        iso: d.date,                // 你這裡 d.date 看起來就是 YYYY-MM-DD
        day: Number(d.date.slice(8, 10)),
        score: Number(d.scores[curveKey] ?? 0),
      }))
      .sort((a, b) => a.iso.localeCompare(b.iso))

    let max = rows[0]
    for (const r of rows) if (!max || r.score > max.score) max = r

    return { rows, max }
  }, [monthData, curveKey])
  
  /* ===== 操作 ===== */
  const onPrevMonth = () => {
    if (!member) return openLogin()
    if (!isPaid) return setShowPaywall(true)
    setCursorMonth((d) => addMonths(d, -1))
  }

  const onNextMonth = () => {
    if (!member) return openLogin()
    if (!isPaid) return setShowPaywall(true)
    setCursorMonth((d) => addMonths(d, 1))
  }

  const onSelectDate = (iso?: string) => {
    if (!iso) return
    if (!member) return openLogin()
    setSelectedISO(iso)
  }

  /* ===== Render ===== */
  if (loading && Object.keys(monthData).length === 0) {
    return <div className="px-4 py-6 text-white">載入中…</div>
  }

  if (error) {
    return <div className="px-4 py-6 text-red-300">{error}</div>
  }

  return (
    <div className="px-1 text-white space-y-4">
      {/* ===== 日曆 ===== */}
      <Section title="🗓️ 日曆" defaultOpen >
        { <div className="flex items-center justify-between mb-2">
          <button onClick={onPrevMonth}>◀</button>
          <div className="min-w-[80px] text-center text-sm">
            {year}/{pad2(month + 1)}
          </div>
          <button onClick={onNextMonth}>▶</button>
        </div> }

        <div className="grid grid-cols-7 mb-2">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="text-center text-xs text-white/50">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) =>
            c.iso && c.date && monthData[c.iso] ? (
              <button
                key={c.iso ?? `empty-${i}`}
                onClick={() => onSelectDate(c.iso)}
                className="aspect-square min-w-[44px] rounded-xl bg-white/5 p-1.5 text-left flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <div className={isSameDay(c.date, today) ? "font-semibold" : ""}>
                    {c.date.getDate()}
                  </div>
                  <div
                    className={`h-2 w-2 rounded-full ${dotTone(
                      monthData[c.iso].scores.overall
                    )}`}
                  />
                </div>
                <div className="text-[10px] leading-tight text-white/40">
                  {monthData[c.iso].scores.overall}
                </div>
              </button>
            ) : (
              <div key={i} />
            )
          )}
        </div>
      </Section>

      {/* ===== 分數曲線 ===== */}
      {isPaid && (
      <Section
        title="📈 分數曲線"
        subtitle={
          curveData.max
            ? `本月最高：${curveData.max.iso}（${curveData.max.score.toFixed(1)}）`
            : undefined
        }
        defaultOpen
      >
        <div className="flex gap-2 flex-wrap">
          {(
            [
              ["整體", "overall"],
              ["財運", "wealth"],
              ["工作", "work"],
              ["投資", "investment"],
              ["人際", "social"],
            ] as const
          ).map(([label, key]) => (
            <button
              key={key}
              onClick={() => setCurveKey(key)}
              className={
                "px-3 py-1.5 rounded-full text-xs border " +
                (curveKey === key
                  ? "bg-white/15 border-white/20 text-white"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <FortuneCurveChart
          data={curveData.rows}
          maxPoint={curveData.max}
          onPickISO={(iso) => {
            setSelectedISO(iso)   // 點曲線同步日曆單日詳細
          }}
        />
        <div className="text-xs text-white/50">
          提示：點曲線上的點可直接切換到該日詳細。
        </div>
      </Section>
      )}

      {/* ===== 單日詳細 ===== */}
      {member && selected && (
        <Section title={`📅 ${selected.date}`} defaultOpen>
          {(
            [
              ["整體", "overall"],
              ["財運", "wealth"],
              ["工作", "work"],
              ["投資", "investment"],
              ["人際", "social"],
            ] as const
          ).map(([label, key]) => (
            <div key={key} className="flex justify-between text-sm">
              <div className="text-white/70">{label}</div>
              <div className={scoreTone(selected.scores[key])}>
                {selected.scores[key]}
              </div>
            </div>
          ))}

          {/* 👇 十神放在同一個 Section 裡 */}
          {selected.meta?.shishen?.main && (
            <div className="pt-3 mt-3 border-t border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60 tracking-wide">
                  主十神
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-base font-semibold text-white">
                  {selected.meta.shishen.main.main}
                </span>
              </div>

              {selected.meta.shishen.main.secondary && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60 tracking-wide">
                    副十神
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-sm font-medium text-white/80">
                    {selected.meta.shishen.main.secondary}
                  </span>
                </div>
              )}
            </div>
          )}
        </Section>
      )}
      {/* ===== 付費提示 ===== */}
      {showPaywall && (
        <div className="rounded-xl bg-yellow-400/10 border border-yellow-400/20 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-yellow-100/90">
              🔒 解鎖完整年運勢、詳細解析與幸運提示
            </div>

            <button
              onClick={() => setShowPaywall(false)}
              className="text-yellow-200/60 hover:text-yellow-200 text-sm"
              aria-label="關閉"
            >
              ✕
            </button>
          </div>

          <a
            href="https://www.highlight.url.tw/shop/index.html#"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowPaywall(false)}
            className="mt-3 block w-full rounded-lg bg-yellow-400/20 py-2 text-center text-sm font-semibold text-yellow-200 hover:bg-yellow-400/30"
          >
            立即升級 →
          </a>
        </div>
      )}
    </div>
  )
}
