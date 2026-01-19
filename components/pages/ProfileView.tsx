"use client"

import React, { useMemo, useState } from "react"

/* =========================
   Types
========================= */

type Pillar = {
  stem: string
  branch: string
}

type BaZi = {
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar
}

type WuxingKey = "木" | "火" | "土" | "金" | "水"

/* =========================
   Constants
========================= */

const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"]
const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]

const STEM_WUXING: Record<string, WuxingKey> = {
  甲:"木", 乙:"木",
  丙:"火", 丁:"火",
  戊:"土", 己:"土",
  庚:"金", 辛:"金",
  壬:"水", 癸:"水",
}

/* =========================
   Helpers（簡化版示意）
   ⚠️ 之後可換成後端精算
========================= */

// ⚠️ 簡化算法：穩定可展示（不是命理最嚴謹）
function calcBaZi(date: Date): BaZi {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  const h = date.getHours()

  return {
    year: {
      stem: STEMS[(y - 4) % 10],
      branch: BRANCHES[(y - 4) % 12],
    },
    month: {
      stem: STEMS[(m + 2) % 10],
      branch: BRANCHES[(m + 2) % 12],
    },
    day: {
      stem: STEMS[(d + 5) % 10],
      branch: BRANCHES[(d + 5) % 12],
    },
    hour: {
      stem: STEMS[Math.floor(h / 2) % 10],
      branch: BRANCHES[Math.floor(h / 2) % 12],
    },
  }
}

function calcWuxing(bazi: BaZi) {
  const count: Record<WuxingKey, number> = {
    木:0, 火:0, 土:0, 金:0, 水:0,
  }

  Object.values(bazi).forEach((p) => {
    const w = STEM_WUXING[p.stem]
    count[w] += 1
  })

  const sorted = Object.entries(count).sort((a,b)=>b[1]-a[1])
  return {
    count,
    main: sorted[0][0] as WuxingKey,
  }
}

/* =========================
   UI
========================= */

export default function ProfilePage() {
  const [birthDate, setBirthDate] = useState("1993-08-10")
  const [birthTime, setBirthTime] = useState("09:30")

  const [notifyDaily, setNotifyDaily] = useState(true)
  const [notifyInvest, setNotifyInvest] = useState(true)
  const [notifyLottery, setNotifyLottery] = useState(false)

  const dateObj = useMemo(() => {
    return new Date(`${birthDate}T${birthTime}:00`)
  }, [birthDate, birthTime])

  const bazi = useMemo(() => calcBaZi(dateObj), [dateObj])
  const wuxing = useMemo(() => calcWuxing(bazi), [bazi])

  return (
    <div className="px-4 py-4 text-white space-y-4">
      {/* ===== 基本資料 ===== */}
      <SectionCard>
        <h2 className="text-lg font-semibold mb-3">👤 個人資料</h2>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="出生日期"
            type="date"
            value={birthDate}
            onChange={setBirthDate}
          />
          <Input
            label="出生時間"
            type="time"
            value={birthTime}
            onChange={setBirthTime}
          />
        </div>
      </SectionCard>

      {/* ===== 天干地支 ===== */}
      <SectionCard>
        <h3 className="text-base font-semibold mb-2">🧭 天干地支</h3>

        <PillarRow label="年柱" pillar={bazi.year} />
        <PillarRow label="月柱" pillar={bazi.month} />
        <PillarRow label="日柱" pillar={bazi.day} />
        <PillarRow label="時柱" pillar={bazi.hour} />
      </SectionCard>

      {/* ===== 五行 ===== */}
      <SectionCard>
        <h3 className="text-base font-semibold mb-2">🌿 五行分析</h3>

        <div className="grid grid-cols-5 gap-2 text-center text-sm">
          {Object.entries(wuxing.count).map(([k,v])=>(
            <div key={k} className="rounded-lg bg-white/5 py-2">
              <div>{k}</div>
              <div className="text-white/70">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-sm text-white/80">
          主五行：
          <span className="ml-2 text-emerald-300 font-medium">
            {wuxing.main}
          </span>
        </div>
      </SectionCard>

      {/* ===== LINE 通知 ===== */}
      <SectionCard>
        <h3 className="text-base font-semibold mb-2">🔔 LINE 通知設定</h3>

        <Toggle
          label="每日運勢通知"
          checked={notifyDaily}
          onChange={setNotifyDaily}
        />
        <Toggle
          label="投資高分日提醒"
          checked={notifyInvest}
          onChange={setNotifyInvest}
        />
        <Toggle
          label="彩券高分日提醒"
          checked={notifyLottery}
          onChange={setNotifyLottery}
        />
      </SectionCard>
    </div>
  )
}

/* =========================
   Small UI Parts
========================= */

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/5 px-4 py-4">{children}</div>
}

function Input({
  label,
  type,
  value,
  onChange,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="text-sm">
      <div className="text-white/60 mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-white outline-none"
      />
    </label>
  )
}

function PillarRow({ label, pillar }: { label: string; pillar: Pillar }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <div className="text-white/60">{label}</div>
      <div className="font-medium">
        {pillar.stem}{pillar.branch}
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={()=>onChange(!checked)}
      className="flex items-center justify-between w-full py-2"
    >
      <span className="text-sm text-white/80">{label}</span>
      <span
        className={`w-10 h-6 rounded-full transition ${
          checked ? "bg-emerald-400" : "bg-white/20"
        }`}
      >
        <span
          className={`block w-5 h-5 bg-black rounded-full mt-0.5 transition ${
            checked ? "ml-5" : "ml-0.5"
          }`}
        />
      </span>
    </button>
  )
}
