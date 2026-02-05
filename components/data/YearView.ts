const BASE = "https://www.highlight.url.tw/ai_fortune/php"

/* =========================
   型別定義
========================= */

export type YearFortune = {
  year: string
  yearType: string
  scores: {
    overall: number
    wealth: number
    career: number
    invest: number
    relation: number
  }
  ai: {
    overall: string
    wealth?: string
    career?: string
    invest?: string
    relation?: string
  }
  lucky: {
    color: string
    stone: string
    direction: string
  }
}

/* =========================
   API 轉換
========================= */

export function adaptYearFortune(api: any): YearFortune {
  return {
    year: api.year,
    yearType: api.year_type,
    scores: {
      overall: api.scores.overall,
      wealth: api.scores.wealth,
      career: api.scores.career,
      invest: api.scores.invest,
      relation: api.scores.relation,
    },
    ai: {
      overall: api.ai?.overall ?? "",
      wealth: api.ai?.wealth ?? "",
      career: api.ai?.career ?? "",
      invest: api.ai?.invest ?? "",
      relation: api.ai?.relation ?? "",
    },
    // ⭐ 關鍵在這裡：一定要補
    lucky: {
      color: api.lucky?.color ?? "—",
      stone: api.lucky?.stone ?? "—",
      direction: api.lucky?.direction ?? "—",
    },
  }
}


/* =========================
   API 呼叫（⚠️重點在這）
========================= */

export async function fetchYearFortune(
  uid: string,
  year: string
): Promise<YearFortune> {
  const res = await fetch(
    `${BASE}/fortune_year.php?uid=${uid}&year=${year}`, // ✅ 改成 year API
    { cache: "no-store" }
  )

  const json = await res.json()
  // console.log("year api:", json)
  return adaptYearFortune(json)
}
