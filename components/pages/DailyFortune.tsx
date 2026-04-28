import { useEffect, useMemo, useState } from "react"
import FortuneShareButton from "@/components/common/FortuneShareButton"
import { fetchDailyFortune } from "@/components/data/DailyFortune"
import type { FortuneResponse } from "@/components/data/DailyFortune"
import { useAuth } from "@/contexts/AuthContext"

export const dailyCache: Record<string, FortuneResponse> = {}
export const dailyPending: Record<string, Promise<FortuneResponse>> = {}

function formatDateYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function DailyFortune() {
  const { member, loading: authLoading, isPaid } = useAuth()
  const [data, setData] = useState<FortuneResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const date = useMemo(() => formatDateYMD(new Date()), [])
  const uid = member ? String(member.member_id) : "guest"
  const cacheKey = `${uid}|${date}`
  const cachedData = dailyCache[cacheKey] ?? null
  const displayData = data ?? cachedData

  useEffect(() => {
    if (authLoading || cachedData) return

    const pending =
      dailyPending[cacheKey] ??
      (dailyPending[cacheKey] = fetchDailyFortune(uid, date))

    pending
      .then((res) => {
        dailyCache[cacheKey] = res
        setData(res)
      })
      .catch((e) => {
        setError(e?.message ?? "讀取今日運勢失敗")
        setData(null)
      })
      .finally(() => {
        if (dailyPending[cacheKey] === pending) {
          delete dailyPending[cacheKey]
        }
      })
  }, [authLoading, cacheKey, cachedData, date, uid])

  if (authLoading) return <div>載入今日運勢中...</div>
  if (error && !displayData) return <div className="text-red-300">{`讀取失敗：${error}`}</div>
  if (!displayData) return <div>載入今日運勢中...</div>

  const shareText = [
    `今日運勢 ${displayData.date}`,
    `整體 ${displayData.score.overall}/10`,
    `財運 ${displayData.score.wealth}/10`,
    `工作 ${displayData.score.career}/10`,
    extractBlock(displayData.text, "overall"),
  ]
    .filter(Boolean)
    .join("\n")

  return (
    <div className="space-y-4 px-1 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">今日運勢</h2>
          <div className="text-sm text-white/60">
            {displayData.date}｜{displayData.gz.year} {displayData.gz.month} {displayData.gz.day}
          </div>
        </div>

        <FortuneShareButton
          title={`AI 今日運勢｜${displayData.date}`}
          text={shareText}
          urlHash="#fortune"
        />
      </div>

      <div className="space-y-2 rounded-lg bg-white/5 px-3 py-3">
        <div className="mb-1 text-sm text-white/60">今日分數總覽</div>
        <ScoreRow label="整體運勢" score={displayData.score.overall} />
        <ScoreRow label="財運" score={displayData.score.wealth} />
        <ScoreRow label="工作" score={displayData.score.career} />
        <ScoreRow label="投資" score={displayData.score.invest} />
        <ScoreRow label="感情" score={displayData.score.relation} />
      </div>

      <Section title="整體運勢解析" defaultOpen>
        <p className="text-sm leading-relaxed text-white/80">
          {extractBlock(displayData.text, "overall")}
        </p>
      </Section>

      {isPaid && (
        <>
          <Section title="財運">
            <p className="text-sm leading-relaxed text-white/80">
              {extractBlock(displayData.text, "wealth")}
            </p>
          </Section>

          <Section title="工作">
            <p className="text-sm leading-relaxed text-white/80">
              {extractBlock(displayData.text, "career")}
            </p>
          </Section>

          <Section title="投資">
            <p className="text-sm leading-relaxed text-white/80">
              {extractBlock(displayData.text, "invest")}
            </p>
          </Section>

          <Section title="感情">
            <p className="text-sm leading-relaxed text-white/80">
              {extractBlock(displayData.text, "relation")}
            </p>
          </Section>
        </>
      )}

      {isPaid && uid !== "guest" && (
        <a
          href={`https://www.highlight.url.tw/ai_fortune/php/lottery.php?uid=${uid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-center text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"
        >
          查看今日彩券建議
        </a>
      )}
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
    <div className="rounded-lg bg-white/5 px-3 py-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-medium text-white/85"
      >
        <span>{title}</span>
        <span className="text-white/50">{open ? "收起" : "展開"}</span>
      </button>

      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  )
}

function extractBlock(
  text?: string | null,
  key?: "overall" | "wealth" | "career" | "invest" | "relation" | "remind"
): string {
  if (!text || !key) return ""

  const emojiMap: Record<string, string[]> = {
    overall: ["🌟", "✨"],
    wealth: ["💰", "💵"],
    career: ["💼", "🧑‍💼"],
    invest: ["📈", "💹"],
    relation: ["❤️", "❤", "🤝", "💕"],
    remind: ["🔔", "🎯"],
  }

  const order = [
    ...emojiMap.overall,
    ...emojiMap.wealth,
    ...emojiMap.career,
    ...emojiMap.invest,
    ...emojiMap.relation,
    ...emojiMap.remind,
  ]
  const candidates = emojiMap[key]
  if (!candidates?.length) return ""

  const matched = candidates
    .map((emoji) => ({ emoji, index: text.indexOf(emoji) }))
    .filter((item) => item.index !== -1)
    .sort((a, b) => a.index - b.index)[0]

  if (!matched) return ""

  const { emoji, index: start } = matched
  const nextIndexes = order
    .map((item) => text.indexOf(item, start + emoji.length))
    .filter((index) => index !== -1 && index > start)

  const end = nextIndexes.length ? Math.min(...nextIndexes) : text.length
  return text.slice(start, end).replace(emoji, "").trim()
}

function getScoreColor(v: number): string {
  if (v >= 8.5) return "text-emerald-300"
  if (v >= 7) return "text-cyan-300"
  if (v >= 5.5) return "text-white/80"
  if (v >= 4.5) return "text-yellow-300"
  return "text-red-400"
}

function ScoreRow({ label, score }: { label: string; score: string }) {
  const value = Number(score)
  const color = getScoreColor(value)

  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/70">{label}</span>
      <span className={`font-semibold ${color}`}>{value} / 10</span>
    </div>
  )
}