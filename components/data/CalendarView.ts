export type MonthFortune = {
  month: string          // 2026-01
  monthType: string      // 官殺
  scores: {
    overall: number
    wealth: number
    work: number
    investment: number
    social: number
  }
  summary: string
}

export type DailyScores = {
  overall: number
  wealth: number
  work: number
  investment: number
  social: number
  lottery: number
}

export type DailyFortune = {
  date: string           // YYYY-MM-DD
  scores: DailyScores
  summaryFree: string
  summaryPaid: string
  tags: string[]
}

/* ===== 中文分數 key → 英文 ===== */
export function mapScores(cn: Record<string, number>) {
  return {
    overall: cn["整體"] ?? 0,
    wealth: cn["財運"] ?? 0,
    work: cn["工作運"] ?? 0,
    investment: cn["投資"] ?? 0,
    social: cn["人際"] ?? 0,
    lottery: cn["彩券"] ?? 0, // 有就用，沒有就 0
  }
}

/* ===== 月運勢 ===== */
export function adaptMonthFortune(api: any): MonthFortune {
  return {
    month: api.month,
    monthType: api.month_type,
    scores: {
      overall: api.scores["整體"],
      wealth: api.scores["財運"],
      work: api.scores["工作運"],
      investment: api.scores["投資"],
      social: api.scores["人際"],
    },
    summary: "本月運勢由系統計算", // 之後可換 AI
  }
}

/* ===== 每日運勢 ===== */
export function adaptDailyList(api: any): Record<string, DailyFortune> {
  const out: Record<string, DailyFortune> = {}

  for (const d of api.days) {
    out[d.date] = {
      date: d.date,
      scores: mapScores(d.scores),
      summaryFree: "查看重點分數",
      summaryPaid: "可查看詳細 AI 解讀",
      tags: [],
    }
  }

  return out
}

const BASE = "https://www.highlight.url.tw/ai_fortune/php"

export async function fetchMonthFortune(
  uid: string,
  month: string
): Promise<MonthFortune> {
  const res = await fetch(
    `${BASE}/fortune_month.php?uid=${uid}&month=${month}`,
    { cache: "no-store" }
  )
  const json = await res.json()
  return adaptMonthFortune(json)
}

export async function fetchDailyForMonth(
  uid: string,
  month: string
): Promise<Record<string, DailyFortune>> {
  const res = await fetch(
    `${BASE}/get_daily_for_month.php?uid=${uid}&month=${month}`,
    { cache: "no-store" }
  )
  const json = await res.json()
  return adaptDailyList(json)
}