import { useEffect, useMemo, useState } from "react"
import { fetchDailyFortune } from "@/components/data/DailyFortune"
import type { FortuneResponse } from "@/components/data/DailyFortune"
import { useAuth } from "@/contexts/AuthContext"

export const dailyCache: Record<string, FortuneResponse> = {}
export const dailyPending: Record<string, Promise<FortuneResponse>> = {}

/* ===== 工具：今天日期 ===== */
function formatDateYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function DailyFortune() {
  const { member, loading: authLoading, isPaid} = useAuth()
  const [data, setData] = useState<FortuneResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const date = useMemo(() => formatDateYMD(new Date()), [])

  useEffect(() => {
    if (authLoading) return

    const uid = member ? String(member.member_id) : "guest"
    const cacheKey = `${uid}|${date}`

    // 1) 命中快取
    if (dailyCache[cacheKey]) {
      setData(dailyCache[cacheKey])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // 2) 如果已經有人在打同一支 API，就等同一個 Promise
    const p =
      dailyPending[cacheKey] ??
      (dailyPending[cacheKey] = fetchDailyFortune(uid, date))

    p.then((res) => {
      dailyCache[cacheKey] = res
      setData(res)
    })
      .catch((e) => {
        setError(e?.message ?? "取得運勢失敗")
        setData(null)
      })
      .finally(() => {
        // 清掉 pending（只清自己的 key）
        if (dailyPending[cacheKey] === p) delete dailyPending[cacheKey]
        setLoading(false)
      })
  }, [authLoading, member, date])

  if (loading) return <div>運勢計算中...</div>
  if (error) return <div className="text-red-300">⚠️ {error}</div>
  if (!data) return <div>尚無今日運勢</div>

  // ... 你原本的 render 不用改
  return (
    <div className="px-1 text-white space-y-4">
      <h2 className="text-xl font-semibold">📅 今日運勢</h2>
      <div className="text-sm text-white/60">
        {data.date}（{data.gz.year} {data.gz.month} {data.gz.day}）
      </div>

      <div className="rounded-lg bg-white/5 px-3 py-3 space-y-2">
        <div className="text-sm text-white/60 mb-1">【系統計算分項運勢】</div>
        <ScoreRow label="整體運勢" score={data.score.overall} />
        <ScoreRow label="財運" score={data.score.wealth} />
        <ScoreRow label="工作運" score={data.score.career} />
        <ScoreRow label="投資運" score={data.score.invest} />
        <ScoreRow label="人際運" score={data.score.relation} />
      </div>

      {/* ② 整體運勢文字（免費） */}
      <Section title="整體運勢說明" defaultOpen>
        <p className="text-sm text-white/80 leading-relaxed">
          {extractBlock(data.text, "overall")}
        </p>
      </Section>

      {/* ③ 只有 VIP 才顯示 */}
      {isPaid && (
        <>
          <Section title="財運">
            <p className="text-sm text-white/80 leading-relaxed">
              {extractBlock(data.text, "wealth")}
            </p>
          </Section>

          <Section title="工作運">
            <p className="text-sm text-white/80 leading-relaxed">
              {extractBlock(data.text, "career")}
            </p>
          </Section>

          <Section title="投資建議">
            <p className="text-sm text-white/80 leading-relaxed">
              {extractBlock(data.text, "invest")}
            </p>
          </Section>

          <Section title="人際互動">
            <p className="text-sm text-white/80 leading-relaxed">
              {extractBlock(data.text, "relation")}
            </p>
          </Section>
        </>
      )}

      {/* 其他 Section 同理 */}
    </div>
  )
}

/* ===== 小元件 ===== */

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
    <div className="rounded-lg bg-white/5 px-1 py-2">
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

function extractBlock(
  text?: string | null,
  key?: "overall" | "wealth" | "career" | "invest" | "relation" | "remind"
): string {
  if (!text || !key) return ""

  const emojiMap: Record<string, string> = {
    overall: "🌟",
    wealth: "💰",
    career: "💼",
    invest: "📈",
    relation: "🤝",
    remind: "🎯",
  }

  const order = ["🌟", "💰", "💼", "📈", "🤝", "🎯"]
  const emoji = emojiMap[key]
  if (!emoji) return ""

  const start = text.indexOf(emoji)
  if (start === -1) return ""

  const nextIndexes = order
    .map((e) => text.indexOf(e, start + emoji.length))
    .filter((i) => i !== -1 && i > start)

  const end = nextIndexes.length ? Math.min(...nextIndexes) : text.length

  // 切出區塊後，把第一個 emoji 移除，再 trim
  const block = text.slice(start, end).trim()
  return block.replace(emoji, "").trim()
}

function getScoreColor(v: number): string {
  if (v >= 8.5) return "text-emerald-300"   // 強運
  if (v >= 7)   return "text-cyan-300"      // 偏強
  if (v >= 5.5) return "text-white/80"      // 穩定
  if (v >= 4.5) return "text-yellow-300"    // 偏弱
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