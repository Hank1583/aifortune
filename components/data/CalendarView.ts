

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



/* ===== 每日運勢 ===== */
export function adaptDailyList(api: any): Record<string, DailyFortune> {
  const out: Record<string, DailyFortune> = {}

  for (const d of api.days) {
    out[d.date] = {
      uid: d.uid ?? "",
      date: d.date,
      scores: mapScores(d.scores),
      meta: d.meta,
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
    `${BASE}/get_daily_for_month.php?uid=${uid}&month=${month}`,
    { cache: "no-store" }
  )
  const json = await res.json()
  // console.log(json);
  return adaptDailyList(json)
}