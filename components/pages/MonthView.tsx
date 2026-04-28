"use client"

import React, { useEffect, useMemo, useState } from "react"
import FortuneShareButton from "@/components/common/FortuneShareButton"
import { useAuth } from "@/contexts/AuthContext"
import {
  fetchMonthFortune,
  type MonthFortune,
} from "@/components/data/MonthView"
import {
  fetchYearFortune,
  type YearFortune,
} from "@/components/data/YearView"

export const monthCache: Record<
  string,
  {
    monthFortune: MonthFortune
    monthData: Record<string, MonthFortune>
  }
> = {}
export const yearCache: Record<string, YearFortune> = {}

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

const pad2 = (n: number) => String(n).padStart(2, "0")
const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

const startOfMonth = (y: number, m: number) => new Date(y, m, 1)
const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1)

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

function renderLuckyColor(color: string) {
  return <span className={colorByText(color)}>{color}</span>
}

function renderLuckyStone(stone: string) {
  return <span className={colorByText(stone)}>{stone}</span>
}

function colorByText(text: string) {
  if (text.includes("紅") || text.includes("赤")) return "text-red-400"
  if (text.includes("黃") || text.includes("金")) return "text-yellow-400"
  if (text.includes("橙")) return "text-amber-300"
  if (text.includes("白")) return "text-white"
  if (text.includes("綠")) return "text-emerald-400"
  if (text.includes("藍")) return "text-sky-400"
  if (text.includes("紫")) return "text-purple-400"
  if (text.includes("灰") || text.includes("黑")) return "text-neutral-300"

  return "text-white"
}

function Section({
  title,
  subtitle,
  action,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl bg-white/5 px-3 py-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold text-white">{title}</div>
            {action}
          </div>
          {subtitle && <div className="mt-0.5 text-xs text-white/50">{subtitle}</div>}
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mt-1 shrink-0 text-sm text-white/50"
        >
          {open ? "收起" : "展開"}
        </button>
      </div>

      {open && <div className="space-y-3">{children}</div>}
    </div>
  )
}

export default function MonthView() {
  const { member, loading: authLoading, isPaid, openLogin } = useAuth()
  const [yearFortune, setYearFortune] = useState<YearFortune | null>(null)
  const [monthFortune, setMonthFortune] = useState<MonthFortune | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

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

  const year = cursorMonth.getFullYear()
  const month = cursorMonth.getMonth()
  const ym = `${year}-${pad2(month + 1)}`
  const monthKey = `${uid}-${ym}`
  const yearKey = `${uid}-${year}`
  const cachedMonth = monthCache[monthKey]?.monthFortune ?? null
  const cachedYear = yearCache[yearKey] ?? null
  const displayMonth = monthFortune ?? cachedMonth
  const displayYear = yearFortune ?? cachedYear

  useEffect(() => {
    if (authLoading) return
    if (cachedMonth && cachedYear) return

    Promise.all([
      cachedMonth ? Promise.resolve(null) : fetchMonthFortune(uid, ym),
      cachedYear ? Promise.resolve(null) : fetchYearFortune(uid, String(year)),
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
      .catch(() => setError("月運勢資料載入失敗"))
  }, [authLoading, cachedMonth, cachedYear, monthKey, uid, ym, year, yearKey])

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

  const onPrevMonth = () => guardedChangeMonth(() => setCursorMonth((d) => addMonths(d, -1)))
  const onNextMonth = () => guardedChangeMonth(() => setCursorMonth((d) => addMonths(d, 1)))

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

  const monthShareText = displayMonth
    ? [
        `${displayMonth.month} 月運勢`,
        `整體 ${displayMonth.scores.overall}`,
        `財運 ${displayMonth.scores.wealth}`,
        `工作 ${displayMonth.scores.career}`,
        displayMonth.ai.overall,
      ]
        .filter(Boolean)
        .join("\n")
    : ""

  const yearShareText = displayYear
    ? [
        `${displayYear.year} 年運勢`,
        `年度主軸：${displayYear.yearType}`,
        `整體 ${displayYear.scores.overall}`,
        `財運 ${displayYear.scores.wealth}`,
        displayYear.ai.overall,
      ]
        .filter(Boolean)
        .join("\n")
    : ""

  if (authLoading) return <div className="px-4 py-6 text-white">載入月運勢中...</div>

  if (error && !displayMonth) {
    return <div className="px-4 py-6 text-red-300">{error}</div>
  }

  if (!displayMonth) return <div className="px-4 py-6 text-white">載入月運勢中...</div>

  return (
    <div className="space-y-4 px-1 py-1 text-white">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={onPrevMonth}>上月</button>
        <div className="min-w-[80px] text-center text-sm">
          {year}/{pad2(month + 1)}
        </div>
        <button type="button" onClick={onNextMonth}>下月</button>
      </div>

      <div className="rounded-2xl bg-white/5 px-3 py-3">
        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs text-white/45">
          {WEEK_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, index) => {
            const isSelected = cell.iso === selectedISO
            return (
              <button
                key={cell.iso ?? `empty-${index}`}
                type="button"
                disabled={!cell.iso}
                onClick={() => cell.iso && setSelectedISO(cell.iso)}
                className={`min-h-11 rounded-lg border px-2 py-2 text-center text-sm transition ${
                  cell.iso
                    ? isSelected
                      ? "border-cyan-300/50 bg-cyan-300/15 text-white"
                      : "border-white/8 bg-white/5 text-white/75 hover:bg-white/10"
                    : "border-transparent bg-transparent"
                }`}
              >
                {cell.date?.getDate() ?? ""}
              </button>
            )
          })}
        </div>
      </div>

      <Section
        title={`${displayMonth.month} 月運勢`}
        action={
          <FortuneShareButton
            title={`AI 月運勢｜${displayMonth.month}`}
            text={monthShareText}
            urlHash="#month"
          />
        }
        defaultOpen
      >
        <div className="grid grid-cols-5 gap-2 text-center">
          {([
            ["整體", displayMonth.scores.overall, false],
            ["工作", displayMonth.scores.career, false],
            ["人際", displayMonth.scores.relation, false],
            ["財運", displayMonth.scores.wealth, false],
            ["投資", displayMonth.scores.invest, false],
          ] as const).map(([label, value, showDot]) => (
            <div key={label} className="rounded-xl bg-white/5 px-2 py-2">
              <div className="flex items-center justify-center gap-1 text-xs text-white/60">
                {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dotTone(value)}`} />}
                {label}
              </div>

              <div className={`mt-1 text-lg font-semibold ${scoreTone(value)}`}>{value}</div>
            </div>
          ))}
        </div>

        {displayMonth.month_shishen && (
          <div className="mt-3 rounded-xl bg-white/5 px-3 py-3 text-sm">
            <div className="mb-1 text-xs text-white/50">本月十神重點</div>

            <div className="flex items-start gap-2">
              <span className="shrink-0 rounded-md bg-yellow-400/20 px-2 py-0.5 text-xs font-semibold text-yellow-300">
                {displayMonth.month_shishen.main.key}
              </span>
              <span className="leading-relaxed text-white/80">
                {displayMonth.month_shishen.main.desc}
              </span>
            </div>

            {displayMonth.month_shishen.sub && (
              <div className="mt-2 text-xs text-white/60">
                補充說明：
                <span className="ml-1 font-semibold text-white/70">
                  {displayMonth.month_shishen.sub.key}
                </span>
                ｜{displayMonth.month_shishen.sub.desc}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-center text-sm text-white/80">
          <span className="text-white/60">幸運元素：</span>
          <span className="font-semibold">{renderLuckyColor(displayMonth.lucky.color)}</span>
          <span className="mx-1 text-white/40">｜</span>
          <span className="font-semibold">{renderLuckyStone(displayMonth.lucky.stone)}</span>
          <span className="mx-1 text-white/40">｜</span>
          <span className="text-white/60">方位：</span>
          <span className="font-semibold">{displayMonth.lucky.direction}</span>
        </div>

        {isPaid && (
          <Section title="AI 月運解析">
            <div className="space-y-2 text-sm leading-relaxed">
              <div className="rounded-lg bg-white/5 px-3 py-2">
                <b>整體：</b>
                {displayMonth.ai.overall}
              </div>

              {displayMonth.ai.wealth && (
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <b>財運：</b>
                  {displayMonth.ai.wealth}
                </div>
              )}

              {displayMonth.ai.career && (
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <b>工作：</b>
                  {displayMonth.ai.career}
                </div>
              )}

              {displayMonth.ai.invest && (
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <b>投資：</b>
                  {displayMonth.ai.invest}
                </div>
              )}
            </div>
          </Section>
        )}
      </Section>

      {displayYear && (
        <Section
          title={`${displayYear.year} 年運勢`}
          action={
            <FortuneShareButton
              title={`AI 年運勢｜${displayYear.year}`}
              text={yearShareText}
              urlHash="#month"
            />
          }
          subtitle={<span className="text-sm font-semibold text-white/80">{`年度主軸：${displayYear.yearType}`}</span>}
        >
          <div className="grid grid-cols-5 gap-2 text-center">
            {([
              ["整體", displayYear.scores.overall, false],
              ["工作", displayYear.scores.career, false],
              ["人際", displayYear.scores.relation, false],
              ["財運", displayYear.scores.wealth, false],
              ["投資", displayYear.scores.invest, false],
            ] as const).map(([label, value, showDot]) => (
              <div key={label} className="rounded-xl bg-white/5 px-2 py-2">
                <div className="flex items-center justify-center gap-1 text-xs text-white/60">
                  {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dotTone(value)}`} />}
                  {label}
                </div>

                <div className={`mt-1 text-lg font-semibold ${scoreTone(value)}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-white/10 px-3 py-3 text-center text-sm">
            <span className="text-white/60">幸運元素：</span>
            <span className="font-semibold">{renderLuckyColor(displayYear.lucky.color)}</span>
            <span className="mx-1 text-white/40">｜</span>
            <span className="font-semibold">{renderLuckyStone(displayYear.lucky.stone)}</span>
            <span className="mx-1 text-white/40">｜</span>
            <span className="text-white/60">方位：</span>
            <span className="font-semibold">{displayYear.lucky.direction}</span>
          </div>

          {isPaid && (
            <Section title="AI 年運解析">
              <div className="space-y-2 text-sm leading-relaxed">
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  <b>整體：</b>
                  {displayYear.ai.overall}
                </div>

                {displayYear.ai.wealth && (
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <b>財運：</b>
                    {displayYear.ai.wealth}
                  </div>
                )}

                {displayYear.ai.career && (
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <b>工作：</b>
                    {displayYear.ai.career}
                  </div>
                )}

                {displayYear.ai.invest && (
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <b>投資：</b>
                    {displayYear.ai.invest}
                  </div>
              )}
              </div>
            </Section>
          )}
        </Section>
      )}

      {showPaywall && (
        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-yellow-100/90">
              升級 VIP 可切換月份，查看完整月運勢與 AI 深度解析。
            </div>
            <button
              type="button"
              onClick={() => setShowPaywall(false)}
              className="text-sm text-yellow-200/60 hover:text-yellow-200"
            >
              關閉
            </button>
          </div>

          <a
            href="https://www.highlight.url.tw/shop/index.html#"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowPaywall(false)}
            className="mt-3 block w-full rounded-lg bg-yellow-400/20 py-2 text-center text-sm font-semibold text-yellow-200 hover:bg-yellow-400/30"
          >
            前往升級 VIP
          </a>
        </div>
      )}
    </div>
  )
}
