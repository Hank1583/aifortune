"use client"

import React, { useEffect, useMemo, useState, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  fetchMonthFortune,
  type MonthFortune,
} from "@/components/data/MonthView"
import {
  fetchYearFortune,
  type YearFortune,
} from "@/components/data/YearView"
export const monthCache: Record<string, {
  monthFortune: MonthFortune
  monthData: Record<string, MonthFortune>
}> = {}
export const yearCache: Record<string, YearFortune> = {}

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

function renderLuckyColor(color: string) {
  return (
    <span className={colorByText(color)}>
      {color}
    </span>
  )
}

function renderLuckyStone(stone: string) {
  return (
    <span className={colorByText(stone)}>
      {stone}
    </span>
  )
}

function colorByText(text: string) {
  if (text.includes("紅")) return "text-red-400"
  if (text.includes("黃")) return "text-yellow-400"
  if (text.includes("金")) return "text-amber-300"
  if (text.includes("白")) return "text-white"
  if (text.includes("綠")) return "text-emerald-400"
  if (text.includes("藍")) return "text-sky-400"
  if (text.includes("紫")) return "text-purple-400"
  if (text.includes("黑")) return "text-neutral-400"

  return "text-white"
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

/* =========================
   Page
========================= */

export default function MonthView() {
  const { member, loading: authLoading, isPaid, openLogin, } = useAuth()
  const [yearFortune, setYearFortune] = useState<YearFortune | null>(null)
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
  const [monthData, setMonthData] = useState<Record<string, MonthFortune>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  const year = cursorMonth.getFullYear()
  const month = cursorMonth.getMonth()
  const ym = `${year}-${pad2(month + 1)}`
  /* ===== 抓 API ===== */
  useEffect(() => {
    if (authLoading) return

    const monthKey = `${uid}-${ym}`
    const yearKey = `${uid}-${year}`

    const cachedMonth = monthCache[monthKey]
    const cachedYear = yearCache[yearKey]

    if (cachedMonth && cachedYear) {
      setMonthFortune(cachedMonth.monthFortune)
      setMonthData(cachedMonth.monthData)
      setYearFortune(cachedYear)
      setLoading(false)
      return
    }

    setLoading(true)

    Promise.all([
      cachedMonth ? null : fetchMonthFortune(uid, ym),
      cachedYear ? null : fetchYearFortune(uid, String(year)),
    ])
      .then(([m, y]) => {
        if (m) {
          setMonthFortune(m)
          monthCache[monthKey] = { monthFortune: m, monthData: {} }
        }
        if (y) {
          setYearFortune(y)
          yearCache[yearKey] = y
        }
      })
      .catch(() => setError("資料載入失敗"))
      .finally(() => setLoading(false))
  }, [authLoading, uid, ym, year])

  const guardedChangeMonth = (fn: () => void) => {
    if (!member) {
      openLogin()
      return
    }
    if (!isPaid) {
      setShowPaywall(true)
      return
    }
    fn()
  }

  const onPrevMonth = () =>
    guardedChangeMonth(() =>
      setCursorMonth((d) => addMonths(d, -1))
    )

  const onNextMonth = () =>
    guardedChangeMonth(() =>
      setCursorMonth((d) => addMonths(d, 1))
    )

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

  /* ===== Render ===== */
  if (loading && !monthFortune) {
    return <div className="px-4 py-6 text-white">載入中…</div>
  }

  if (error) {
    return <div className="px-4 py-6 text-red-300">{error}</div>
  }

  return (
    <div className="px-1 py-1 text-white space-y-4">
      {/* 月份切換 */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onPrevMonth}>◀</button>
        <div className="min-w-[80px] text-center text-sm">
          {year}/{pad2(month + 1)}
        </div>
        <button onClick={onNextMonth}>▶</button>
      </div>

      {monthFortune && (
        <Section
          title={`📅 ${monthFortune.month} 月運勢`}
          defaultOpen
        >
          {/* ===== 分數（5 個一排，方塊） ===== */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {([
              ["整體", monthFortune.scores.overall, false],
              ["工作", monthFortune.scores.career, false],
              ["人際", monthFortune.scores.relation, false],
              ["財運", monthFortune.scores.wealth, false],
              ["投資", monthFortune.scores.invest, false],
            ] as const).map(([label, value, showDot]) => (
              <div
                key={label}
                className="rounded-xl bg-white/5 px-2 py-2"
              >
                <div className="flex items-center justify-center gap-1 text-xs text-white/60">
                  {showDot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${dotTone(value)}`} />
                  )}
                  {label}
                </div>

                <div className={`mt-1 text-lg font-semibold ${scoreTone(value)}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* ===== 本月十神（月運勢定位） ===== */}
          {monthFortune.month_shishen && (
            <div className="mt-3 rounded-xl bg-white/5 px-3 py-3 text-sm">
              <div className="mb-1 flex items-center gap-1 text-xs text-white/50">
                🧭 本月主題
              </div>

              <div className="flex items-start gap-2">
                <span className="shrink-0 rounded-md bg-yellow-400/20 px-2 py-0.5 text-xs font-semibold text-yellow-300">
                  {monthFortune.month_shishen.main.key}
                </span>
                <span className="text-white/80 leading-relaxed">
                  {monthFortune.month_shishen.main.desc}
                </span>
              </div>

              {monthFortune.month_shishen.sub && (
                <div className="mt-2 text-xs text-white/60">
                  輔助：
                  <span className="ml-1 font-semibold text-white/70">
                    {monthFortune.month_shishen.sub.key}
                  </span>
                  ｜{monthFortune.month_shishen.sub.desc}
                </div>
              )}
            </div>
          )}

          {/* ===== Lucky（字體放大） ===== */}
          <div className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-center text-white/80">
            <span className="text-white/60">幸運：</span>

            <span className="font-semibold">
              {renderLuckyColor(monthFortune.lucky.color)}
            </span>

            <span className="mx-1 text-white/40">｜</span>

            <span className="font-semibold">
              {renderLuckyStone(monthFortune.lucky.stone)}
            </span>

            <span className="mx-1 text-white/40">｜</span>

            <span className="text-white/60">方位：</span>
            <span className="font-semibold">
              {monthFortune.lucky.direction}
            </span>
          </div>

          {/* ===== AI 解析 ===== */}
          {isPaid && (
          <Section title="🔍 本月解析" defaultOpen={false}>
            <div className="space-y-2 text-sm leading-relaxed">
              <div className="bg-white/5 rounded-lg px-3 py-2">
                <b>整體：</b>{monthFortune.ai.overall}
              </div>

              {monthFortune.ai.wealth && (
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <b>財運：</b>{monthFortune.ai.wealth}
                </div>
              )}

              {monthFortune.ai.career && (
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <b>工作：</b>{monthFortune.ai.career}
                </div>
              )}

              {monthFortune.ai.invest && (
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <b>投資：</b>{monthFortune.ai.invest}
                </div>
              )}
            </div>
          </Section>
          )}
        </Section>
      )}


      {/* =====================
          年運勢
      ===================== */}
      {yearFortune && (
        <Section
          title={`🌟 ${yearFortune.year} 年運勢`}
          subtitle={
            <span className="text-sm font-semibold text-white/80">
              年度主軸：{yearFortune.yearType}
            </span>
          }
        >
          {/* ===== 分數（5 個一排，方塊） ===== */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {([
              ["整體", yearFortune.scores.overall, false],
              ["工作", yearFortune.scores.career, false],
              ["人際", yearFortune.scores.relation, false],
              ["財運", yearFortune.scores.wealth, false],
              ["投資", yearFortune.scores.invest, false],
            ] as const).map(([label, value, showDot]) => (
              <div
                key={label}
                className="rounded-xl bg-white/5 px-2 py-2"
              >
                <div className="flex items-center justify-center gap-1 text-xs text-white/60">
                  {showDot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${dotTone(value)}`} />
                  )}
                  {label}
                </div>

                <div className={`mt-1 text-lg font-semibold ${scoreTone(value)}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Lucky（手機友善） */}
          <div className="mt-3 rounded-xl bg-white/10 px-3 py-3 text-sm text-center">
            <span className="text-white/60">幸運：</span>

            <span className="font-semibold">
              {renderLuckyColor(yearFortune.lucky.color)}
            </span>

            <span className="mx-1 text-white/40"> ｜ </span>

            <span className="font-semibold">
              {renderLuckyStone(yearFortune.lucky.stone)}
            </span>

            <span className="mx-1 text-white/40"> ｜ </span>

            <span className="text-white/60">方位：</span>
            <span className="font-semibold">
              {yearFortune.lucky.direction}
            </span>
          </div>

          {/* AI 分析 */}
          {isPaid && (
          <Section title="🔍 年度解析" defaultOpen={false}>
            <div className="space-y-2 text-sm leading-relaxed">
              <div className="bg-white/5 rounded-lg px-3 py-2">
                <b>整體：</b>{yearFortune.ai.overall}
              </div>

              {yearFortune.ai.wealth && (
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <b>財運：</b>{yearFortune.ai.wealth}
                </div>
              )}

              {yearFortune.ai.career && (
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <b>工作：</b>{yearFortune.ai.career}
                </div>
              )}

              {yearFortune.ai.invest && (
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <b>投資：</b>{yearFortune.ai.invest}
                </div>
              )}
            </div>
          </Section>
          )}
        </Section>
      )}

      {/* Paywall */}
      {showPaywall && (
        <div className="rounded-xl bg-yellow-400/10 border border-yellow-400/20 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-yellow-100/90">
              🔒 升級 VIP 可切換月份，查看完整月運勢與解析
            </div>
            <button
              onClick={() => setShowPaywall(false)}
              className="text-yellow-200/60 hover:text-yellow-200 text-sm"
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
