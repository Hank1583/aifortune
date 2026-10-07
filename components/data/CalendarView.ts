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

export type DayGanzhi = {
  year: string
  month: string
  day: string
}

type GanzhiApiResponse = {
  data?: Record<string, { ganzhi?: Partial<DayGanzhi> }>
}

// month: yyyy-mm，回傳 { "yyyy-mm-dd": { year, month, day } }
export async function fetchGanzhiForMonth(
  month: string
): Promise<Record<string, DayGanzhi>> {
  const [y, m] = month.split("-").map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const start = `${month}-01`
  const end = `${month}-${String(lastDay).padStart(2, "0")}`

  const res = await fetch(
    `${BASE}/sync_date.php?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
  )

  if (!res.ok) {
    throw new Error("Failed to fetch ganzhi")
  }

  const json = (await res.json()) as GanzhiApiResponse
  const out: Record<string, DayGanzhi> = {}

  for (const [date, day] of Object.entries(json.data ?? {})) {
    const gz = day.ganzhi
    if (!gz?.day) continue
    out[date] = {
      year: gz.year ?? "",
      month: gz.month ?? "",
      day: gz.day,
    }
  }

  return out
}

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
