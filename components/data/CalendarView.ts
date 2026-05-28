export type DailyScores = {
  overall: number
  wealth: number
  work: number
  investment: number
  social: number
  lottery: number
}

export type DailyFortune = {
  uid: string
  date: string
  scores: {
    overall: number
    wealth: number
    work: number
    investment: number
    social: number
  }
  meta?: {
    shishen?: {
      main?: {
        main: string
        secondary?: string
        confidence?: number
      }
    }
  }
}

type ApiDay = {
  uid?: string
  date?: string
  scores?: Record<string, number> | unknown[]
  meta?: DailyFortune["meta"]
  error?: string
}

type ApiResponse = {
  days?: ApiDay[]
}

function normalizeScores(scores: ApiDay["scores"]) {
  if (!scores || Array.isArray(scores)) return undefined
  return scores
}

function readScore(scores: Record<string, number> | undefined, keys: string[]) {
  if (!scores) return null
  for (const key of keys) {
    const value = scores[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
  }
  return null
}

export function mapScores(scores: ApiDay["scores"]) {
  const normalized = normalizeScores(scores)

  return {
    overall: readScore(normalized, ["整體", "整體運勢", "總運"]) ?? 0,
    wealth: readScore(normalized, ["財運"]) ?? 0,
    work: readScore(normalized, ["工作運", "事業", "工作"]) ?? 0,
    investment: readScore(normalized, ["投資", "投資運"]) ?? 0,
    social: readScore(normalized, ["人際", "感情", "社交"]) ?? 0,
    lottery: readScore(normalized, ["彩券", "樂透"]) ?? 0,
  }
}

function hasScoreData(scores: DailyScores) {
  return Object.values(scores).some((value) => value > 0)
}

export function adaptDailyList(api: ApiResponse): Record<string, DailyFortune> {
  const out: Record<string, DailyFortune> = {}

  for (const day of api.days ?? []) {
    if (!day.date || day.error) continue

    const scores = mapScores(day.scores)
    if (!hasScoreData(scores)) continue

    out[day.date] = {
      uid: day.uid ?? "",
      date: day.date,
      scores,
      meta: day.meta,
    }
  }

  return out
}

const BASE = "https://www.highlight.url.tw/ai_fortune/php"

export async function fetchDailyForMonth(
  uid: string,
  month: string
): Promise<Record<string, DailyFortune>> {
  const res = await fetch(
    `${BASE}/get_daily_for_month.php?uid=${encodeURIComponent(uid)}&month=${encodeURIComponent(month)}`,
    { cache: "no-store" }
  )

  if (!res.ok) {
    throw new Error("Failed to fetch daily scores")
  }

  const json = (await res.json()) as ApiResponse
  return adaptDailyList(json)
}
