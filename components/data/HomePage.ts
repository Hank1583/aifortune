"use client"
import { useEffect, useMemo, useState } from "react"

export type WuxingKey = "木" | "火" | "土" | "金" | "水"

interface ApiDayData {
  date: string
  ganzhi: {
    year: string
    month: string
    day: string
  }
  wuxing: Record<WuxingKey, number>
  dominant: WuxingKey
  summary: string
  trendDirection: "up" | "down" | "flat" | null
}

interface ApiResponse {
  mode: string
  start: string
  end: string
  count: number
  data: Record<string, ApiDayData>
}

/* =========================
   Utils
========================= */

// 把 0~? 浮點 → 0~5（UI 用）
function normalize(v: number) {
  return Math.min(5, Math.round(v))
}

// yyyy-mm-dd
function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function getRange() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const end = new Date(yesterday)
  end.setDate(yesterday.getDate() +7)

  return {
    start: formatDate(yesterday),
    end: formatDate(end),
  }
}

/* =========================
   Hook
========================= */

export function useFortuneData() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const { start, end } = getRange()
    const path =
      `https://www.highlight.url.tw/ai_fortune/php/sync_date.php?start=${start}&end=${end}`
    fetch(path)
      .then((r) => r.json())
      .then((json: ApiResponse) => {
        const days = Object.values(json.data)

        let today =
          json.data[new Date().toISOString().slice(0, 10)]

        if (!today) {
          const keys = Object.keys(json.data).sort()
          today = json.data[keys[keys.length - 1]]
        }

        const trend7ByWuxing: Record<WuxingKey, number[]> = {
          木: [],
          火: [],
          土: [],
          金: [],
          水: [],
        }

        days.forEach((d) => {
          ;(Object.keys(d.wuxing) as WuxingKey[]).forEach((k) => {
            trend7ByWuxing[k].push(normalize(d.wuxing[k]))
          })
        })

        setData({
          today: {
            date: today.date,
            ganzhi: `${today.ganzhi.year}｜${today.ganzhi.day}`,
            summary: today.summary,
            dominant: today.dominant,
            trendDirection: today.trendDirection ?? "flat",
            wuxing: Object.keys(today.wuxing).map((k) => ({
              key: k as WuxingKey,
              value: normalize(today.wuxing[k as WuxingKey]),
            })),
            trend7ByWuxing,
          },
        })
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { data, isLoading, error }
}
