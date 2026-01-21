import { useEffect, useState } from "react"
import { fetchDailyFortune } from "@/components/data/DailyFortune"
import type { FortuneResponse } from "@/components/data/DailyFortune"
import { useAuth } from "@/contexts/AuthContext"

export const dailyCache: Record<string, FortuneResponse> = {}
export const dailyPending: Record<string, boolean> = {}

/* ===== 工具：今天日期 ===== */
function formatDateYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function DailyFortune() {
  const { member, loading: authLoading } = useAuth()
  const [data, setData] = useState<FortuneResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const date = formatDateYMD(new Date())

  useEffect(() => {
    if (authLoading) return

    const uid = member
      ? String(member.member_id)
      : "guest"

    const cacheKey = `${uid}|${date}`

    if (dailyCache[cacheKey]) {
      setData(dailyCache[cacheKey])
      setLoading(false)
      return
    }

    // ✅ 防止重複請求
    if (dailyPending[cacheKey]) return
    dailyPending[cacheKey] = true

    setLoading(true)

    fetchDailyFortune(uid, date)
      .then(res => {
        dailyCache[cacheKey] = res
        setData(res)
      })
      .finally(() => {
        delete dailyPending[cacheKey]
        setLoading(false)
      })
  }, [authLoading, member, date])

  if (loading) return <div>運勢計算中...</div>
  if (!data) return <div>尚無今日運勢</div>

  return (
    <div className="px-4 text-white space-y-4">
      {/* 標題 */}
      <h2 className="text-xl font-semibold">📅 今日運勢</h2>
      <div className="text-sm text-white/60">
        {data.date}（{data.gz.year} {data.gz.month} {data.gz.day}）
      </div>

      {/* ① 系統分項（可收合） */}
      <div className="rounded-lg bg-white/5 px-3 py-3 space-y-2">
        <div className="text-sm text-white/60 mb-1">
          【系統計算分項運勢】
        </div>

        <ScoreRow label="整體運勢" score={data.score.overall} />
        <ScoreRow label="財運" score={data.score.wealth} />
        <ScoreRow label="工作運" score={data.score.career} />
        <ScoreRow label="投資運" score={data.score.invest} />
        <ScoreRow label="人際運" score={data.score.relation} />
      </div>

      {/* ② 整體運勢文字 */}
      <Section title="整體運勢說明">
        <p className="text-sm text-white/80 leading-relaxed">
          {extractBlock(data.text, "🌟 整體運勢")}
        </p>
      </Section>

      {/* ③ 各分項說明 */}
      <Section title="財運">
        <p className="text-sm text-white/80 leading-relaxed">
          {extractBlock(data.text, "💰 財運")}
        </p>
      </Section>

      <Section title="工作運">
        <p className="text-sm text-white/80 leading-relaxed">
          {extractBlock(data.text, "💼 工作運")}
        </p>
      </Section>

      <Section title="投資建議">
        <p className="text-sm text-white/80 leading-relaxed">
          {extractBlock(data.text, "📈 投資建議")}
        </p>
      </Section>

      <Section title="人際互動">
        <p className="text-sm text-white/80 leading-relaxed">
          {extractBlock(data.text, "🤝 人際互動")}
        </p>
      </Section>
    </div>
  )
}

/* ===== 小元件 ===== */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/70">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-sm font-medium text-white/85"
      >
        <span>{title}</span>
        <span className="text-white/50">{open ? "▲" : "▼"}</span>
      </button>

      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  )
}

/* ===== 工具：從後端 text 擷取段落 ===== */

function extractBlock(text: string, title: string): string {
  // 1️⃣ 用 title 找到該段落開始
  const startIndex = text.indexOf(title)
  if (startIndex === -1) return ""

  // 2️⃣ 從該段落開始切
  const sliced = text.slice(startIndex)

  // 3️⃣ 用換行切行
  const lines = sliced.split("\n")

  // 4️⃣ 丟掉第一行（含分數的標題行）
  const contentLines: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()

    // 碰到下一個段落標題就停（emoji + 空白）
    if (/^[🌟💰💼📈🤝🎯]/.test(line)) {
      break
    }

    if (line !== "") {
      contentLines.push(line)
    }
  }

  return contentLines.join("\n").trim()
}


function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-400"
  if (score >= 5) return "text-yellow-400"
  return "text-red-400"
}

function ScoreRow({label,score,}: {label: string,score: string}) {
  const value = Number(score)
  const color = getScoreColor(value)

  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/70">{label}</span>
      <span className={`font-semibold ${color}`}>
        {value} / 10
      </span>
    </div>
  )
}