export type DayMasterStrengthResult =
  | "身強"
  | "偏強"
  | "中和"
  | "偏弱"
  | "身弱"

export type DayMasterStrength = {
  day_master: string
  support: number
  drain: number
  ratio: number
  result: DayMasterStrengthResult
}

export type WuxingKey = "木" | "火" | "土" | "金" | "水"
export type WuxingCount = Record<WuxingKey, number>
export type TenGodCount = Record<string, number>

export type ProfileData = {
  id: number | null
  memberId: number | null
  exists: boolean
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
  shishen_analysis: string
}

type SaveProfileInput = {
  id?: number | null
  memberId: number
  name: string
  birthDate: string
  birthTime: string
  gender: "男" | "女"
  lineUserId?: string | null
}

const PROFILE_ENDPOINT = "/api/profile"

export function getEmptyProfile(memberId?: number | null): ProfileData {
  return {
    id: null,
    memberId: memberId ?? null,
    exists: false,
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
      result: "中和",
    },
    wuxing: {
      木: 0,
      火: 0,
      土: 0,
      金: 0,
      水: 0,
    },
    tenGod: {},
    shishen_analysis: "",
  }
}

export function hasProfileData(profile: ProfileData | null | undefined) {
  if (!profile) return false
  if (profile.exists) return true
  return Boolean(profile.birth.date || profile.birth.time)
}

function safeParse<T>(json: string | undefined | null, fallback: T): T {
  try {
    if (!json) return fallback
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function mapApiToProfile(
  api: Record<string, unknown> | null | undefined,
  mid?: number | null
): ProfileData {
  const empty = getEmptyProfile(mid)
  if (!api || typeof api !== "object") return empty

  const id = toNumber(api.id)
  const memberId = toNumber(api.member_id) ?? mid ?? null
  const normalizedId = id && id > 0 ? id : null

  if (normalizedId == null && !api.birth_date && !api.birth_time && !api.gender) {
    return {
      ...empty,
      memberId,
    }
  }

  const scheduleList = String(api.schedule ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  const sectionList = String(api.section ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    id: normalizedId,
    memberId,
    exists: true,
    birth: {
      date: String(api.birth_date ?? ""),
      time: api.birth_time ? String(api.birth_time).slice(0, 5) : "",
      gender: String(api.gender ?? "") === "女" ? "女" : "男",
    },
    schedule: {
      daily: scheduleList.includes("daily"),
      monthly: scheduleList.includes("monthly"),
    },
    notify: {
      overall: sectionList.includes("overall"),
      wealth: sectionList.includes("wealth"),
      career: sectionList.includes("career"),
      invest: sectionList.includes("invest"),
      social: sectionList.includes("social"),
      lottery: sectionList.includes("lottery"),
    },
    dayMasterStrength: safeParse(
      api.body_strength as string | undefined,
      empty.dayMasterStrength
    ),
    wuxing: safeParse(api.wuxing_json as string | undefined, empty.wuxing),
    tenGod: safeParse(api.shishen_json as string | undefined, empty.tenGod),
    shishen_analysis: String(api.shishen_analysis ?? ""),
  }
}

export async function getProfileAPI(mid: string): Promise<ProfileData> {
  const res = await fetch(`${PROFILE_ENDPOINT}?mid=${mid}`)

  if (!res.ok) {
    throw new Error("Failed to fetch profile")
  }

  const apiData = (await res.json()) as Record<string, unknown>
  return mapApiToProfile(apiData, toNumber(mid))
}

export async function getProfile(mid?: string): Promise<ProfileData> {
  if (!mid) {
    return getEmptyProfile()
  }

  try {
    return await getProfileAPI(mid)
  } catch {
    return getEmptyProfile(toNumber(mid))
  }
}

export async function saveProfile(input: SaveProfileInput) {
  const payload = {
    name: input.name,
    member_id: input.memberId,
    birth_date: input.birthDate,
    birth_time: input.birthTime,
    gender: input.gender,
    line_user_id: input.lineUserId ?? undefined,
    ...(input.id && input.id > 0 ? { id: input.id } : {}),
  }

  const res = await fetch(PROFILE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(
      (data &&
        typeof data === "object" &&
        ((typeof data.message === "string" && data.message) ||
          (typeof data.error === "string" && data.error))) ||
        "儲存個人資料失敗"
    )
  }

  if (
    data &&
    typeof data === "object" &&
    typeof data.status === "string" &&
    data.status !== "success"
  ) {
    throw new Error(
      (typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        "儲存個人資料失敗"
    )
  }

  return data
}
