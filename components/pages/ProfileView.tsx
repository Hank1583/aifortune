"use client"

import { useMemo, useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getProfile, ProfileData } from "@/components/data/profile"

export const profileCache: Record<string, ProfileData> = {}
export const profilePending: Record<string, boolean> = {}

/* =========================
   對照表
========================= */
type WuxingKey = "木" | "火" | "土" | "金" | "水"

const STEM_WUXING: Record<string, string> = {
  甲: "木", 乙: "木",
  丙: "火", 丁: "火",
  戊: "土", 己: "土",
  庚: "金", 辛: "金",
  壬: "水", 癸: "水",
}

const WUXING_COLOR: Record<WuxingKey, string> = {
  木: "bg-green-400",
  火: "bg-red-400",
  土: "bg-yellow-400",
  金: "bg-gray-300",
  水: "bg-blue-400",
}

/* =========================
   主頁
========================= */
export default function ProfilePage() {
  const { member, loading: authLoading, isPaid} = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [loading, setLoading] = useState(true)
  const [gender, setGender] = useState<"男" | "女">("男")
  const [isEditing, setIsEditing] = useState(false)
  
  const [schedule, setSchedule] = useState({
    daily: false,
    monthly: false,
  })

  const [notify, setNotify] = useState({
    overall: false,
    wealth: false,
    career: false,
    invest: false,
    social: false,
    lottery: false,
  })

  const [isSettingOpen, setIsSettingOpen] = useState(false)
  const [isTenGodOpen, setIsTenGodOpen] = useState(false)

  useEffect(() => {
    if (authLoading) return

    const uid = member
      ? String(member.member_id)
      : "guest"

    // ✅ cache 命中
    if (profileCache[uid]) {
      const p = profileCache[uid]
      setProfile(p)
      
      setBirthDate(p.birth.date)
      setBirthTime(p.birth.time)
      setGender(p.birth.gender)
      setSchedule(p.schedule)
      setNotify(p.notify)
      setLoading(false)
      return
    }

    // ✅ 防止重複請求
    if (profilePending[uid]) return
    profilePending[uid] = true

    setLoading(true)

    getProfile(uid)
      .then(res => {
        profileCache[uid] = res
        setProfile(res)

        setBirthDate(res.birth.date)
        setBirthTime(res.birth.time)
        setGender(res.birth.gender)
        setSchedule(res.schedule)
        setNotify(res.notify)
      })
      .finally(() => {
        delete profilePending[uid]
        setLoading(false)
      })
  }, [authLoading, member?.member_id])

  /* =========================
     Memo
  ========================= */

  const tenGodList = useMemo(() => {
    if (!profile) return []
    return Object.entries(profile.tenGod).sort((a, b) => b[1] - a[1])
  }, [profile])

  const maxTenGod = tenGodList.length ? tenGodList[0][1] : 0

  const dayMaster = profile?.dayMasterStrength.day_master ?? ""
  const dayMasterWuxing = dayMaster ? STEM_WUXING[dayMaster] : ""

  const ENABLE_PROFILE_EDIT = false

  const wuxing = useMemo(() => {
    try {
      if (!profile?.wuxing) return null
      return typeof profile.wuxing === "string"
        ? JSON.parse(profile.wuxing)
        : profile.wuxing
    } catch {
      return null
    }
  }, [profile])

  const maxWuxing = wuxing
    ? Math.max(...Object.values(wuxing).map(Number))
    : 1
  /* =========================
     Render Gate（只能在 Hooks 後）
  ========================= */

  const formatShishenText = (text: string) => {
    if (!text) return ""

    return text
      // 1️⃣ 移除標題
      .replace(/^【十神解讀】\s*\n*/u, "")
      // 2️⃣ 把每個單一換行變成雙換行
      .replace(/\n/g, "\n\n")
  }

  if (authLoading || !profile) {
    return <div>載入中...</div>
  }

  /* =========================
     正式 Render
  ========================= */

  return (
    <div className="px-4 py-4 text-white space-y-4">

      {/* ================= 基本資料 / 通知 ================= */}
      <SectionCard>
        <div
          className="flex justify-between items-center mb-3 cursor-pointer"
          onClick={() => {
            if (isEditing) return
            setIsSettingOpen(!isSettingOpen)
          }}
        >
          <h2 className="text-lg font-semibold">👤 個人設定</h2>
          <span className="text-xs text-white/50">
            {isSettingOpen ? "收合" : "展開"}
          </span>
        </div>

        {isSettingOpen && (
          <>
            {/* 基本資料 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Input
                label="出生日期"
                type="date"
                value={birthDate}
                onChange={setBirthDate}
                disabled={!isEditing}
              />
              <Input
                label="出生時間"
                type="time"
                value={birthTime}
                onChange={setBirthTime}
                disabled={!isEditing}
              />
              <Select
                label="性別"
                value={gender}
                onChange={setGender}
                disabled={!isEditing}
                options={["男", "女"]}
              />
            </div>

            {/* ---------- 通知設定 ---------- */}
            <div className="space-y-6">

              {/* 時間區段 */}
              <div>
                <h3 className="mb-3 text-base font-semibold text-yellow-500">
                  時間區段
                </h3>
                <div className="flex gap-4">
                  <Toggle
                    label="每日運勢"
                    checked={schedule.daily}
                    onChange={(v: boolean) => setSchedule({ ...schedule, daily: v })}
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="每月運勢"
                    checked={schedule.monthly}
                    onChange={(v: boolean) => setSchedule({ ...schedule, monthly: v })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* 運勢類型 */}
              <div>
                <h3 className="mb-3 text-base font-semibold text-yellow-500">
                  運勢類型
                </h3>
                <div className="space-y-2">
                  <Toggle
                    label="整體運勢"
                    checked={notify.overall}
                    onChange={(v: boolean) => setNotify({ ...notify, overall: v })}
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="財運"
                    checked={notify.wealth}
                    onChange={(v: boolean) => setNotify({ ...notify, wealth: v })}
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="工作運"
                    checked={notify.career}
                    onChange={(v: boolean) => setNotify({ ...notify, career: v })}
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="投資運"
                    checked={notify.invest}
                    onChange={(v: boolean) => setNotify({ ...notify, invest: v })}
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="人際運"
                    checked={notify.social}
                    onChange={(v: boolean) => setNotify({ ...notify, social: v })}
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="彩券運"
                    checked={notify.lottery}
                    onChange={(v: boolean) => setNotify({ ...notify, lottery: v })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

            </div>
          </>
        )}

      </SectionCard>

      {/* ================= 命盤總覽 ================= */}
      <SectionCard>
        <h3 className="font-semibold mb-2">🧭 命盤總覽</h3>
        <Row label="日主" value={`${dayMaster}（${dayMasterWuxing}）`} />
        <Row label="身強弱" value={profile.dayMasterStrength.result} />

        {wuxing && (
          <div className="mt-3 space-y-2">
            {Object.entries(wuxing).map(([k, v]) => (
              <Bar
                key={k}
                label={`五行｜${k}`}
                value={Number(v)}
                max={maxWuxing}
                color={WUXING_COLOR[k as WuxingKey]}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* ================= 十神分佈 ================= */}
      {isPaid &&(
      <SectionCard>
        <div
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => setIsTenGodOpen(!isTenGodOpen)}
        >
          <h3 className="font-semibold">📊 十神</h3>
          <span className="text-xs text-white/50">
            {isTenGodOpen ? "收合" : "展開"}
          </span>
        </div>

        {isTenGodOpen && (
          <div className="space-y-3">
            {/* 1) 十神長條 */}
            <div className="space-y-2">
              {tenGodList.map(([k, v]) => (
                <Bar key={k} label={k} value={v} max={maxTenGod || 1} />
              ))}
            </div>

            {/* 2) 十神文字分析（VIP） */}
            {!!profile?.shishen_analysis && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="font-semibold mb-5">🧾 十神解讀（VIP）</div>
                <div className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                  {formatShishenText(profile.shishen_analysis)}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
      )}
    </div>
  )
}

/* =========================
   UI 元件
========================= */

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/5 px-4 py-4">{children}</div>
}

function Input({ label, value, onChange, disabled, type }: any) {
  return (
    <label className="text-sm">
      <div className="text-white/60 mb-1">{label}</div>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-white disabled:bg-white/5"
      />
    </label>
  )
}

function Select({ label, options, value, onChange, disabled }: any) {
  return (
    <label className="text-sm">
      <div className="text-white/60 mb-1">{label}</div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-white disabled:bg-white/5"
      >
        {options.map((o: string) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/60">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function Bar({ label, value, max, color = "bg-emerald-400" }: any) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-white/10 rounded">
        <div
          className={`h-full rounded ${color}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange, disabled }: any) {
  return (
    <button
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="flex justify-between w-full text-sm disabled:opacity-40"
    >
      <span>{label}</span>
      <span className={`w-10 h-6 rounded-full ${checked ? "bg-emerald-400" : "bg-white/20"}`}>
        <span className={`block w-5 h-5 bg-black rounded-full mt-0.5 ${checked ? "ml-5" : "ml-0.5"}`} />
      </span>
    </button>
  )
}