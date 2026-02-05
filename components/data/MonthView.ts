const BASE = "https://www.highlight.url.tw/ai_fortune/php"

/* =========================
   型別定義（月運勢）
========================= */

export type MonthFortune = {
  month: string
  monthType: string

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
  month_shishen?: {
    main: {
      key: string
      desc: string
    }
    sub?: {
      key: string
      desc: string
    }
  }
}

/* =========================
   API 轉換（月運勢）
========================= */

export function adaptMonthFortune(api: any): MonthFortune {
  return {
    month: api.month,
    monthType: api.month_type,

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

    lucky: {
      color: api.lucky?.color ?? "",
      stone: api.lucky?.stone ?? "",
      direction: api.lucky?.direction ?? "",
    },
    month_shishen: api.month_shishen
      ? {
          main: {
            key: api.month_shishen.main?.key ?? "",
            desc: api.month_shishen.main?.desc ?? "",
          },
          sub: api.month_shishen.sub
            ? {
                key: api.month_shishen.sub.key ?? "",
                desc: api.month_shishen.sub.desc ?? "",
              }
            : undefined,
        }
      : undefined,
  }
}

/* =========================
   API 呼叫（月運勢）
========================= */

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
