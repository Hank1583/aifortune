"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  getProfile,
  hasProfileData,
  ProfileData,
  saveProfile,
  type WuxingKey,
} from "@/components/data/profile"

export const profileCache: Record<string, ProfileData> = {}
export const profilePending: Record<string, boolean> = {}

const STEM_WUXING: Record<string, string> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
}

const WUXING_COLOR: Record<WuxingKey, string> = {
  木: "bg-green-400",
  火: "bg-red-400",
  土: "bg-yellow-400",
  金: "bg-gray-300",
  水: "bg-blue-400",
}

export default function ProfilePage() {
  const {
    member,
    loading: authLoading,
    isPaid,
    lineUid,
    updateMember,
    isAdmin,
    effectiveMemberId,
    isViewingAsAdmin,
    viewUid,
    setViewUid,
    clearViewUid,
  } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gender, setGender] = useState<"男" | "女">("男")
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
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
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false)
  const [draftViewUid, setDraftViewUid] = useState(viewUid ?? "")

  useEffect(() => {
    if (authLoading) return

    const uid = effectiveMemberId ?? "guest"

    if (profileCache[uid]) {
      hydrate(profileCache[uid])
      setLoading(false)
      return
    }

    if (profilePending[uid]) return
    profilePending[uid] = true

    setLoading(true)

    getProfile(effectiveMemberId ?? undefined)
      .then((result) => {
        profileCache[uid] = result
        hydrate(result)
      })
      .finally(() => {
        delete profilePending[uid]
        setLoading(false)
      })
  }, [authLoading, effectiveMemberId])

  const hasData = hasProfileData(profile)
  const tenGodList = useMemo(() => {
    if (!profile) return []
    return Object.entries(profile.tenGod).sort((a, b) => b[1] - a[1])
  }, [profile])
  const maxTenGod = tenGodList.length ? tenGodList[0][1] : 1
  const dayMaster = profile?.dayMasterStrength.day_master ?? ""
  const dayMasterWuxing = dayMaster ? STEM_WUXING[dayMaster] ?? "" : ""
  const wuxing = profile?.wuxing ?? null
  const maxWuxing = wuxing ? Math.max(...Object.values(wuxing).map(Number), 1) : 1

  useEffect(() => {
    setDraftViewUid(viewUid ?? "")
  }, [viewUid])

  function hydrate(nextProfile: ProfileData) {
    setProfile(nextProfile)
    setBirthDate(nextProfile.birth.date)
    setBirthTime(nextProfile.birth.time)
    setGender(nextProfile.birth.gender)
    setSchedule(nextProfile.schedule)
    setNotify(nextProfile.notify)
    setIsSettingOpen(!hasProfileData(nextProfile))
    setIsEditing(!hasProfileData(nextProfile))
    setFormError(null)
    setFormSuccess(null)
  }

  async function handleSave() {
    if (isViewingAsAdmin) {
      setFormError("管理員查看模式僅供檢視，請先返回自己的帳號再修改資料")
      return
    }

    if (!member?.member_id) {
      setFormError("目前沒有可儲存的會員資料")
      return
    }

    if (!birthDate || !birthTime) {
      setFormError("請先填寫出生日期與出生時間")
      return
    }

    setSaving(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const saved = await saveProfile({
        id: profile?.id ?? null,
        memberId: member.member_id,
        name: member.name || `member-${member.member_id}`,
        birthDate,
        birthTime,
        gender,
        lineUserId: lineUid,
      })

      if (
        saved &&
        typeof saved === "object" &&
        "id" in saved &&
        typeof saved.id === "number" &&
        saved.id > 0
      ) {
        updateMember({ user_fortune_id: saved.id })
      }

      const refreshed = await getProfile(effectiveMemberId ?? String(member.member_id))
      profileCache[effectiveMemberId ?? String(member.member_id)] = refreshed
      hydrate(refreshed)
      setIsEditing(false)
      setIsSettingOpen(true)
      setFormSuccess("個人資料已更新")
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "儲存失敗，請稍後再試"
      )
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (profile) {
      hydrate(profile)
    }
  }

  function handleViewSubmit() {
    const nextUid = draftViewUid.trim()
    if (!nextUid) return
    setDraftViewUid(nextUid)
    setViewUid(nextUid)
    setIsAdminPanelOpen(false)
  }

  if (authLoading || loading || !profile) {
    return <div className="px-4 py-4 text-white">載入中...</div>
  }

  return (
    <div className="space-y-4 px-4 py-4 text-white">
      {isAdmin && (
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-cyan-100">管理員查看</div>
              <div className="mt-1 text-xs text-cyan-50/75">
                {isViewingAsAdmin && viewUid
                  ? `目前正在查看：會員 ${viewUid}`
                  : "需要時再切換查看其他會員，不會擠在主導覽列"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsAdminPanelOpen((value) => !value)}
                className="rounded-xl border border-cyan-200/20 px-4 py-2 text-sm text-cyan-50 transition hover:bg-cyan-200/10"
              >
                {isAdminPanelOpen ? "收起管理員工具" : "管理員查看"}
              </button>

              {isViewingAsAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftViewUid("")
                    clearViewUid()
                  }}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
                >
                  返回自己的帳號
                </button>
              )}
            </div>
          </div>

          {isAdminPanelOpen && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                inputMode="numeric"
                value={draftViewUid}
                onChange={(event) => setDraftViewUid(event.target.value)}
                placeholder="輸入 member_id"
                className="min-w-[220px] rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button
                type="button"
                onClick={handleViewSubmit}
                className="rounded-xl bg-cyan-300/85 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-200"
              >
                切換查看
              </button>
            </div>
          )}
        </div>
      )}

      {isViewingAsAdmin && viewUid && (
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
          目前正在查看：會員 {viewUid}。此模式目前先提供檢視資料，不直接開放編輯。
        </div>
      )}

      {isViewingAsAdmin && viewUid && !hasData && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          會員 {viewUid} 目前尚未建立個人資料，因此還沒有可查看的命盤內容。
        </div>
      )}

      {!hasData && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          首次登入請先完成個人資料，系統才會建立你的專屬命盤內容。
        </div>
      )}

      <SectionCard>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 text-left"
            onClick={() => {
              if (isEditing) return
              setIsSettingOpen((value) => !value)
            }}
          >
            <h2 className="text-lg font-semibold">個人設定</h2>
            <span className="text-xs text-white/50">
              {isSettingOpen ? "收起" : "展開"}
            </span>
          </button>

          {!isEditing ? (
            <button
              type="button"
              disabled={isViewingAsAdmin}
              onClick={() => {
                setIsSettingOpen(true)
                setIsEditing(true)
                setFormError(null)
                setFormSuccess(null)
              }}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              編輯
            </button>
          ) : null}
        </div>

        {isSettingOpen && (
          <>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-base font-semibold text-yellow-500">
                  接收頻率
                </h3>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                  <Toggle
                    label="每日運勢"
                    checked={schedule.daily}
                    onChange={(value: boolean) =>
                      setSchedule({ ...schedule, daily: value })
                    }
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="每月運勢"
                    checked={schedule.monthly}
                    onChange={(value: boolean) =>
                      setSchedule({ ...schedule, monthly: value })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-base font-semibold text-yellow-500">
                  通知項目
                </h3>
                <div className="space-y-2">
                  <Toggle
                    label="整體運勢"
                    checked={notify.overall}
                    onChange={(value: boolean) =>
                      setNotify({ ...notify, overall: value })
                    }
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="財運"
                    checked={notify.wealth}
                    onChange={(value: boolean) =>
                      setNotify({ ...notify, wealth: value })
                    }
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="事業"
                    checked={notify.career}
                    onChange={(value: boolean) =>
                      setNotify({ ...notify, career: value })
                    }
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="投資"
                    checked={notify.invest}
                    onChange={(value: boolean) =>
                      setNotify({ ...notify, invest: value })
                    }
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="社交"
                    checked={notify.social}
                    onChange={(value: boolean) =>
                      setNotify({ ...notify, social: value })
                    }
                    disabled={!isEditing}
                  />
                  <Toggle
                    label="彩券"
                    checked={notify.lottery}
                    onChange={(value: boolean) =>
                      setNotify({ ...notify, lottery: value })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {formSuccess}
              </div>
            )}

            {isEditing && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-cyan-300/85 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "儲存中..." : "儲存個人資料"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  取消
                </button>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {hasData && (
        <SectionCard>
          <h3 className="mb-2 font-semibold">命盤總覽</h3>
          <Row
            label="日主"
            value={dayMaster ? `${dayMaster}（${dayMasterWuxing}）` : "-"}
          />
          <Row label="強弱判定" value={profile.dayMasterStrength.result} />

          {wuxing && (
            <div className="mt-3 space-y-2">
              {Object.entries(wuxing).map(([key, value]) => (
                <Bar
                  key={key}
                  label={`五行：${key}`}
                  value={Number(value)}
                  max={maxWuxing}
                  color={WUXING_COLOR[key as WuxingKey]}
                />
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {isPaid && hasData && (
        <SectionCard>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-2 text-left"
              onClick={() => setIsTenGodOpen((value) => !value)}
            >
              <h3 className="font-semibold">十神分析</h3>
              <span className="text-xs text-white/50">
                {isTenGodOpen ? "收起" : "展開"}
              </span>
            </button>
          </div>

          {isTenGodOpen && (
            <div className="space-y-3">
              <div className="space-y-2">
                {tenGodList.map(([key, value]) => (
                  <Bar key={key} label={key} value={value} max={maxTenGod} />
                ))}
              </div>

              {!!profile.shishen_analysis && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-5 font-semibold">AI 十神解析</div>
                  <div className="whitespace-pre-line text-sm leading-relaxed text-white/85">
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

function formatShishenText(text: string) {
  if (!text) return ""
  return text.replace(/\n/g, "\n\n")
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/5 px-4 py-4">{children}</div>
}

function Input({
  label,
  value,
  onChange,
  disabled,
  type,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  type: string
}) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-white/60">{label}</div>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-white disabled:bg-white/5"
      />
    </label>
  )
}

function Select({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string
  options: Array<"男" | "女">
  value: "男" | "女"
  onChange: (value: "男" | "女") => void
  disabled: boolean
}) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-white/60">{label}</div>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as "男" | "女")}
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-white disabled:bg-white/5"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
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

function Bar({
  label,
  value,
  max,
  color = "bg-emerald-400",
}: {
  label: string
  value: number
  max: number
  color?: string
}) {
  const width = max > 0 ? (value / max) * 100 : 0

  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded bg-white/10">
        <div className={`h-full rounded ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="flex w-full justify-between text-sm disabled:opacity-40"
    >
      <span>{label}</span>
      <span
        className={`h-6 w-10 rounded-full ${
          checked ? "bg-emerald-400" : "bg-white/20"
        }`}
      >
        <span
          className={`mt-0.5 block h-5 w-5 rounded-full bg-black ${
            checked ? "ml-5" : "ml-0.5"
          }`}
        />
      </span>
    </button>
  )
}
