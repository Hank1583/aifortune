/* =========================
 * 型別定義
 * ========================= */

export type DayMasterStrengthResult =
  | "從強"
  | "身強"
  | "一般"
  | "身弱"
  | "從弱"

export type DayMasterStrength = {
  day_master: string
  support: number
  drain: number
  ratio: number
  result: DayMasterStrengthResult
}

export type WuxingCount = Record<"木" | "火" | "土" | "金" | "水", number>

export type TenGodCount = {
  比肩: number
  劫財: number
  食神: number
  傷官: number
  偏財: number
  正財: number
  七殺: number
  正官: number
  偏印: number
  正印: number
}

export type ProfileData = {
  birth: {
    date: string
    time: string
    gender: "男" | "女"
  }
  schedule: {
    daily: boolean
    monthly: boolean
  }
  notify: {
    overall: boolean
    wealth: boolean
    career: boolean
    invest: boolean
    social: boolean
    lottery: boolean
  }
  dayMasterStrength: DayMasterStrength
  wuxing: WuxingCount
  tenGod: TenGodCount
}

/* =========================
 * Empty Profile（保底）
 * ========================= */

export function getEmptyProfile(): ProfileData {
  return {
    birth: {
      date: "",
      time: "",
      gender: "男",
    },

    schedule: {
      daily: false,
      monthly: false,
    },

    notify: {
      overall: false,
      wealth: false,
      career: false,
      invest: false,
      social: false,
      lottery: false,
    },

    dayMasterStrength: {
      day_master: "",
      support: 0,
      drain: 0,
      ratio: 0,
      result: "一般",
    },

    wuxing: {
      木: 0,
      火: 0,
      土: 0,
      金: 0,
      水: 0,
    },

    tenGod: {
      比肩: 0,
      劫財: 0,
      食神: 0,
      傷官: 0,
      偏財: 0,
      正財: 0,
      七殺: 0,
      正官: 0,
      偏印: 0,
      正印: 0,
    },
  }
}

/* =========================
 * 工具：安全 JSON parse
 * ========================= */

function safeParse<T>(json: string | undefined | null, fallback: T): T {
  try {
    if (!json) return fallback
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/* =========================
 * API → ProfileData mapping
 * ========================= */

function mapApiToProfile(api: any): ProfileData {
  const empty = getEmptyProfile()

  const scheduleList = (api.schedule ?? "").split(",")
  const sectionList = (api.section ?? "").split(",")

  return {
    birth: {
      date: api.birth_date ?? "",
      time: api.birth_time ? api.birth_time.slice(0, 5) : "",
      gender: api.gender === "女" ? "女" : "男",
    },

    schedule: {
      daily: scheduleList.includes("日"),
      monthly: scheduleList.includes("月"),
    },

    notify: {
      overall: sectionList.includes("整體"),
      wealth: sectionList.includes("財運"),
      career: sectionList.includes("工作運"),
      invest: sectionList.includes("投資"),
      social: sectionList.includes("人際"),
      lottery: sectionList.includes("彩券"),
    },

    dayMasterStrength: safeParse(
      api.body_strength,
      empty.dayMasterStrength
    ),

    wuxing: safeParse(
      api.wuxing_json,
      empty.wuxing
    ),

    tenGod: safeParse(
      api.shishen_json,
      empty.tenGod
    ),
  }
}

/* =========================
 * API 呼叫
 * ========================= */

export async function getProfileAPI(mid: string): Promise<ProfileData> {
  const res = await fetch(`https://www.highlight.url.tw/ai_fortune/php/get_user_fortune.php?mid=${mid}`)
  console.log(`https://www.highlight.url.tw/ai_fortune/php/get_user_fortune.php?mid=${mid}`);
  if (!res.ok) {
    throw new Error("Failed to fetch profile")
  }

  const apiData = await res.json()
  return mapApiToProfile(apiData)
}

/* =========================
 * 對外統一入口
 * ========================= */

export async function getProfile(mid?: string): Promise<ProfileData> {
  console.log("mid:"+mid);
  if (!mid) {
    return getEmptyProfile()
  }

  try {
    return await getProfileAPI(mid)
  } catch (err) {
    console.error("getProfile error:", err)
    return getEmptyProfile()
  }
}
