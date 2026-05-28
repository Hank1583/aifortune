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

function hasDailyScores(data: FortuneResponse) {
  return Object.values(data.score ?? {}).some((value) => Number(value) > 0)
}

export default function DailyFortune() {
  const { effectiveMemberId, loading: authLoading, isPaid } = useAuth()
  const [data, setData] = useState<FortuneResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const date = useMemo(() => formatDateYMD(new Date()), [])
  const uid = effectiveMemberId ?? "guest"
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
        setError(e?.message ?? "今日運勢讀取失敗")
        setData(null)
      })
      .finally(() => {
        if (dailyPending[cacheKey] === pending) {
          delete dailyPending[cacheKey]
        }
      })
  }, [authLoading, cacheKey, cachedData, date, uid])

  if (authLoading) return <div>正在載入今日運勢...</div>
  if (error && !displayData) return <div className="text-red-300">{error}</div>
  if (!displayData) return <div>正在載入今日運勢...</div>
  if (!hasDailyScores(displayData)) {
    return (
      <div className="px-1 pb-8 text-white">
        今日運勢尚未產生，請稍後再試。
      </div>
    )
  }

  const shareText = [
    `未來演算所｜今日運勢 ${displayData.date}`,
    `總運 ${displayData.score.overall}/10`,
    `財運 ${displayData.score.wealth}/10`,
    `事業 ${displayData.score.career}/10`,
  ]
    .filter(Boolean)
    .join("\n")

  return (
    <div className="space-y-4 px-1 pb-8 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">今日運勢</h2>
          <div className="text-sm text-white/60">
            {displayData.date}｜{displayData.gz.year} {displayData.gz.month}{" "}
            {displayData.gz.day}
          </div>
        </div>

        <FortuneShareButton
          title={`未來演算所｜今日運勢 ${displayData.date}`}
          text={shareText}
          urlHash="#fortune"
        />
      </div>

      <div className="space-y-2 rounded-lg bg-white/5 px-3 py-3">
        <div className="mb-1 text-sm text-white/60">今日分數</div>
        <ScoreRow label="總運" score={displayData.score.overall} />
        <ScoreRow label="財運" score={displayData.score.wealth} />
        <ScoreRow label="事業" score={displayData.score.career} />
        <ScoreRow label="投資" score={displayData.score.invest} />
        <ScoreRow label="人際 / 感情" score={displayData.score.relation} />
      </div>

      {isPaid ? (
        <>
          <Section title="今日運勢解析" defaultOpen>
            <div className="whitespace-pre-line text-sm leading-relaxed text-white/80">
              {displayData.text}
            </div>
          </Section>

          {uid !== "guest" && (
            <a
              href={`https://www.highlight.url.tw/ai_fortune/php/lottery.php?uid=${uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-center text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"
            >
              查看今日彩券建議
            </a>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm leading-relaxed text-white/60">
          VIP 會員可查看今日完整運勢解析與彩券建議。
        </div>
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
        <span className="text-white/50">{open ? "收合" : "展開"}</span>
      </button>

      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  )
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
