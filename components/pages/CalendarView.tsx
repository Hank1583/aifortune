"use client"

import ReactECharts from "echarts-for-react"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  fetchDailyForMonth,
  type DailyFortune,
} from "@/components/data/CalendarView"

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"]
const dailyCache: Record<string, Record<string, DailyFortune>> = {}
const dailyPendingCache: Record<string, Promise<Record<string, DailyFortune>>> =
  {}
const DAILY_MONTH_API_BASE =
  "https://www.highlight.url.tw/ai_fortune/php/get_daily_for_month.php"

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

type QueryCandidate = {
  source: string
  value: string
}

function uniqueCandidates(candidates: Array<QueryCandidate | null>) {
  const seen = new Set<string>()
  const out: QueryCandidate[] = []

  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate.value)) continue
    seen.add(candidate.value)
    out.push(candidate)
  }

  return out
}

function scoreTone(v: number) {
  if (v >= 8.5) return "text-emerald-300"
  if (v >= 7) return "text-cyan-300"
  if (v >= 5.5) return "text-white/80"
  if (v >= 4.5) return "text-yellow-300"
  return "text-red-400"
}

function dotTone(v: number) {
  if (v >= 8.5) return "bg-emerald-400"
  if (v >= 7) return "bg-cyan-400"
  if (v >= 5.5) return "bg-white/50"
  if (v >= 4.5) return "bg-yellow-400"
  return "bg-red-400"
}

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
    <div className="rounded-2xl bg-white/5 px-3 py-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mb-3 flex w-full items-start justify-between text-left"
      >
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-white/50">{subtitle}</div>}
        </div>
        <div className="mt-1 text-sm text-white/50">
          {open ? "收合" : "展開"}
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
        valueFormatter: (v: number) => Number(v).toFixed(1),
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
          markLine: maxPoint
            ? {
                symbol: "none",
                lineStyle: { color: "rgba(16,185,129,0.5)", width: 1 },
                label: { show: false },
                data: [{ xAxis: maxPoint.day - 1 }],
              }
            : undefined,
        },
      ],
    }
  }, [data, maxPoint])

  const onEvents = useMemo(
    () => ({
      click: (params: { dataIndex?: number }) => {
        const idx = params?.dataIndex
        const iso = typeof idx === "number" ? data[idx]?.iso : undefined
        if (iso) onPickISO(iso)
      },
    }),
    [data, onPickISO]
  )

  if (!data.length) return null

  return (
    <div className="h-[260px] w-full touch-none">
      <ReactECharts
        option={option}
        onEvents={onEvents}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  )
}

export default function CalendarView() {
  const {
    member,
    loading: authLoading,
    isPaid,
    openLogin,
    effectiveMemberId,
    isViewingAsAdmin,
  } = useAuth()

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
  const [curveKey, setCurveKey] = useState<
    "overall" | "wealth" | "work" | "investment" | "social"
  >("wealth")

  const year = cursorMonth.getFullYear()
  const month = cursorMonth.getMonth()
  const ym = `${year}-${pad2(month + 1)}`

  const queryCandidates = useMemo(
    () =>
      uniqueCandidates([
        isViewingAsAdmin && effectiveMemberId
          ? { source: "admin view_uid", value: effectiveMemberId }
          : null,
        member?.member_id
          ? { source: "member.member_id", value: String(member.member_id) }
          : null,
      ]),
    [
      effectiveMemberId,
      isViewingAsAdmin,
      member,
    ]
  )

  useEffect(() => {
    if (authLoading || !member) return

    if (!queryCandidates.length) {
      queueMicrotask(() => {
        setMonthData({})
        setLoading(false)
      })
      return
    }

    const cached = queryCandidates
      .map((candidate) => dailyCache[`${candidate.value}-${ym}`])
      .find((data) => data && Object.keys(data).length > 0)

    if (cached) {
      queueMicrotask(() => {
        setMonthData(cached)
        setLoading(false)
        setError(null)
      })
      return
    }

    queueMicrotask(() => {
      setLoading(true)
      setError(null)
    })

    async function loadWithFallback() {
      for (const candidate of queryCandidates) {
        const cacheKey = `${candidate.value}-${ym}`
        const cachedData = dailyCache[cacheKey]

        if (cachedData && Object.keys(cachedData).length > 0) {
          return cachedData
        }

        const url = `${DAILY_MONTH_API_BASE}?uid=${encodeURIComponent(candidate.value)}&month=${encodeURIComponent(ym)}`
        console.log(
          `[CalendarView] fetch daily month (${candidate.source}):`,
          url
        )
        const pending =
          dailyPendingCache[cacheKey] ??
          (dailyPendingCache[cacheKey] = fetchDailyForMonth(candidate.value, ym))

        const data = await pending.finally(() => {
          if (dailyPendingCache[cacheKey] === pending) {
            delete dailyPendingCache[cacheKey]
          }
        })

        dailyCache[cacheKey] = data

        if (Object.keys(data).length > 0) return data
      }

      return {}
    }

    loadWithFallback()
      .then((data) => {
        setMonthData(data)
        if (Object.keys(data).length === 0) {
          console.warn(
            "[CalendarView] API returned days, but no usable score fields were found. Check whether the backend is returning scores as an object for this member."
          )
          setError("本月暫無日曆分數資料。")
        }
      })
      .catch(() => setError("日曆分數讀取失敗，請稍後再試。"))
      .finally(() => setLoading(false))
  }, [authLoading, member, queryCandidates, ym])

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

  const curveData = useMemo(() => {
    const rows = Object.values(monthData)
      .map((d) => ({
        iso: d.date,
        day: Number(d.date.slice(8, 10)),
        score: Number(d.scores[curveKey] ?? 0),
      }))
      .sort((a, b) => a.iso.localeCompare(b.iso))

    let max = rows[0]
    for (const r of rows) if (!max || r.score > max.score) max = r

    return { rows, max }
  }, [monthData, curveKey])

  const onPrevMonth = () => {
    if (!member) return openLogin()
    if (!isPaid) return
    setCursorMonth((d) => addMonths(d, -1))
  }

  const onNextMonth = () => {
    if (!member) return openLogin()
    if (!isPaid) return
    setCursorMonth((d) => addMonths(d, 1))
  }

  const onSelectDate = (iso?: string) => {
    if (!iso) return
    if (!member) return openLogin()
    setSelectedISO(iso)
  }

  if (authLoading) {
    return <div className="px-4 py-6 text-white">正在載入日曆...</div>
  }

  if (!member) {
    return <div className="px-4 py-6 text-white">請先登入後查看日曆。</div>
  }

  if (loading && Object.keys(monthData).length === 0) {
    return <div className="px-4 py-6 text-white">正在載入日曆分數...</div>
  }

  if (error) {
    return <div className="px-4 py-6 text-red-300">{error}</div>
  }

  return (
    <div className="space-y-4 px-1 text-white">
      <Section title="本月日曆" defaultOpen>
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onPrevMonth}
            disabled={!isPaid}
            className="rounded-lg px-3 py-1 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-35"
          >
            上月
          </button>
          <div className="min-w-[80px] text-center text-sm">
            {year}/{pad2(month + 1)}
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={!isPaid}
            className="rounded-lg px-3 py-1 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-35"
          >
            下月
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="text-center text-xs text-white/50">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) =>
            c.iso && c.date ? (
              <button
                key={c.iso}
                type="button"
                onClick={() => onSelectDate(c.iso)}
                className={`flex aspect-square min-w-[44px] flex-col rounded-xl p-1.5 text-left transition ${
                  selectedISO === c.iso
                    ? "bg-cyan-300/15 ring-1 ring-cyan-300/40"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={isSameDay(c.date, today) ? "font-semibold" : ""}>
                    {c.date.getDate()}
                  </div>
                  {monthData[c.iso] && (
                    <div
                      className={`h-2 w-2 rounded-full ${dotTone(
                        monthData[c.iso].scores.overall
                      )}`}
                    />
                  )}
                </div>
                <div className="mt-auto text-[10px] leading-tight text-white/45">
                  {monthData[c.iso]?.scores.overall ?? "-"}
                </div>
              </button>
            ) : (
              <div key={`empty-${i}`} />
            )
          )}
        </div>
      </Section>

      {isPaid && (
        <Section
          title="分數曲線"
          subtitle={
            curveData.max
              ? `本月高點 ${curveData.max.iso}｜${curveData.max.score.toFixed(1)}`
              : undefined
          }
          defaultOpen
        >
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["總運", "overall"],
                ["財運", "wealth"],
                ["事業", "work"],
                ["投資", "investment"],
                ["人際", "social"],
              ] as const
            ).map(([label, key]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCurveKey(key)}
                className={
                  "rounded-full border px-3 py-1.5 text-xs " +
                  (curveKey === key
                    ? "border-white/20 bg-white/15 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                }
              >
                {label}
              </button>
            ))}
          </div>

          <FortuneCurveChart
            data={curveData.rows}
            maxPoint={curveData.max}
            onPickISO={setSelectedISO}
          />
        </Section>
      )}

      {selected && (
        <Section title={`單日分數 ${selected.date}`} defaultOpen>
          {(
            [
              ["總運", "overall"],
              ["財運", "wealth"],
              ["事業", "work"],
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

          {selected.meta?.shishen?.main && (
            <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm tracking-wide text-white/60">
                  主十神
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-base font-semibold text-white">
                  {selected.meta.shishen.main.main}
                </span>
              </div>

              {selected.meta.shishen.main.secondary && (
                <div className="flex items-center justify-between">
                  <span className="text-sm tracking-wide text-white/60">
                    次十神
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-sm font-medium text-white/80">
                    {selected.meta.shishen.main.secondary}
                  </span>
                </div>
              )}
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
