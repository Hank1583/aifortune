"use client"

import React, { useEffect, useMemo, useState, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  fetchMonthFortune,
  fetchDailyForMonth,
  type MonthFortune,
  type DailyFortune,
} from "@/components/data/CalendarView"

export const monthCache: Record<string, {
  monthFortune: MonthFortune
  monthData: Record<string, DailyFortune>
}> = {}
/* =========================
   日期工具
========================= */

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

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
  if (v >= 8) return "text-emerald-300"
  if (v >= 6) return "text-white/80"
  if (v >= 4) return "text-yellow-300"
  return "text-red-300"
}

function dotTone(v: number) {
  if (v >= 8) return "bg-emerald-400"
  if (v >= 6) return "bg-white/50"
  if (v >= 4) return "bg-yellow-400"
  return "bg-red-400"
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
    <div className="rounded-2xl bg-white/5 px-4 py-4">
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

/* =========================
   Page
========================= */

export default function CalendarView() {
  const {
    member,
    loading: authLoading,
    isPaid,
    openLogin,
  } = useAuth()

  const uid = member ? String(member.member_id) : "guest"

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [cursorMonth, setCursorMonth] = useState(
    startOfMonth(today.getFullYear(), today.getMonth())
  )
  const [selectedISO, setSelectedISO] = useState(toISO(today))

  const [monthFortune, setMonthFortune] = useState<MonthFortune | null>(null)
  const [monthData, setMonthData] = useState<Record<string, DailyFortune>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  const year = cursorMonth.getFullYear()
  const month = cursorMonth.getMonth()
  const ym = `${year}-${pad2(month + 1)}`
  /* ===== 抓 API ===== */
  useEffect(() => {
    if (authLoading) return
    // ✅ 有快取就直接用
    if (monthCache[ym]) {
      const cached = monthCache[ym]
      setMonthFortune(cached.monthFortune)
      setMonthData(cached.monthData)
      return
    }

    // ❌ 沒快取才打 API
    setLoading(true)
    Promise.all([
      fetchMonthFortune(uid, ym),
      fetchDailyForMonth(uid, ym),
    ])
      .then(([m, d]) => {
        setMonthFortune(m)
        setMonthData(d)

        // ✅ 存快取
        monthCache[ym] = {
          monthFortune: m,
          monthData: d,
        }
      })
      .catch(() => setError("資料載入失敗"))
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
  if (!monthFortune) {
    return <div className="px-4 py-6 text-white">載入中…</div>
  }

  if (error) {
    return <div className="px-4 py-6 text-red-300">{error}</div>
  }

  return (
    <div className="px-4 py-4 text-white space-y-4">

      {/* ===== 月運勢 ===== */}
      {monthFortune && (
        <Section
          title={`📆 ${year}/${pad2(month + 1)} 月運勢`}
          subtitle={`月令：${monthFortune.monthType}`}
          defaultOpen
        >
          <div className="grid grid-cols-7 gap-1">
            <div>整體：{monthFortune.scores.overall}</div>
            <div>財運：{monthFortune.scores.wealth}</div>
            <div>工作：{monthFortune.scores.work}</div>
            <div>投資：{monthFortune.scores.investment}</div>
            <div>人際：{monthFortune.scores.social}</div>
          </div>

          <div className="rounded-lg bg-white/5 px-3 py-2 text-sm">
            {monthFortune.summary}
          </div>
        </Section>
      )}

      {/* ===== 日曆 ===== */}
      <Section
        title="🗓️ 日曆"
        subtitle={
          member
            ? isPaid
              ? "付費會員：可切換月份"
              : "免費會員：僅本月"
            : "請先登入"
        }
        defaultOpen
      >
        {/* <div className="flex items-center justify-between mb-2">
          <button onClick={onPrevMonth}>◀</button>
          <div className="min-w-[80px] text-center text-sm">
            {year}/{pad2(month + 1)}
          </div>
          <button onClick={onNextMonth}>▶</button>
        </div> */}

        <div className="grid grid-cols-7 mb-2">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="text-center text-xs text-white/50">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((c, i) =>
            c.iso && c.date && monthData[c.iso] ? (
              <button
                key={i}
                onClick={() => onSelectDate(c.iso)}
                className=" aspect-square rounded-xl bg-white/5 p-1.5 text-left flex flex-col "
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
        </Section>
      )}

      {/* ===== 付費提示 ===== */}
      {showPaywall && (
        <Section title="升級付費會員" defaultOpen>
          <button
            onClick={() => {
              // TODO: 導去升級頁 / LINE
              setShowPaywall(false)
            }}
            className="w-full rounded-lg bg-yellow-400/20 py-2 text-sm text-yellow-200"
          >
            立即升級 →
          </button>
        </Section>
      )}
    </div>
  )
}
