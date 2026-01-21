"use client"

import { useState } from "react"

import CosmicSphere from "@/components/CosmicSphere/CosmicSphere"
import type { TodayFortune } from "@/components/CosmicSphere/CosmicSphere"

import TopNav from "@/components/layout/TopNav"
import ContentPanel from "@/components/layout/ContentPanel"

import DailyWuxing from "@/components/pages/HomePage"
import DailyFortune from "@/components/pages/DailyFortune"
import CalendarView from "@/components/pages/CalendarView"
import ProfileView from "@/components/pages/ProfileView"

import { useFortuneData } from "@/components/data/HomePage"

/* =========================
   Main Page
========================= */

export default function HomePage() {
  const [tab, setTab] = useState<
    "wuxing" | "fortune" | "calendar" | "profile"
  >("wuxing")

  const { data, isLoading } = useFortuneData()

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    )
  }

  if (!data?.today) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        No data
      </main>
    )
  }
  
  const todayFortune: TodayFortune | null = data
    ? {
        date: data.today.date,
        ganzhi: data.today.ganzhi,
        element: mapDominantToElement(data.today.dominant),
        wuxingCount: toWuxingCount(data.today.wuxing),
      }
    : null

  return (
    <main className="relative min-h-screen bg-black text-white">
      {/* ===== 宇宙主視覺（只在資料 ready 時顯示） ===== */}
      {!isLoading && todayFortune && (
        <CosmicSphere todayFortune={todayFortune} />
      )}

      <TopNav active={tab} onChange={setTab} />

      <ContentPanel>
        {tab === "wuxing" && <DailyWuxing />}
        {tab === "fortune" && <DailyFortune />}
        {tab === "calendar" && <CalendarView />}
        {tab === "profile" && <ProfileView />}
      </ContentPanel>
    </main>
  )
}

/* =========================
   Helpers（資料轉換層）
========================= */

function mapDominantToElement(
  d: "木" | "火" | "土" | "金" | "水"
): TodayFortune["element"] {
  const map = {
    木: "wood",
    火: "fire",
    土: "earth",
    金: "metal",
    水: "water",
  } as const
  return map[d]
}

function toWuxingCount(
  list: { key: "木" | "火" | "土" | "金" | "水"; value: number }[]
): TodayFortune["wuxingCount"] {
  return {
    wood: list.find((w) => w.key === "木")?.value ?? 0,
    fire: list.find((w) => w.key === "火")?.value ?? 0,
    earth: list.find((w) => w.key === "土")?.value ?? 0,
    metal: list.find((w) => w.key === "金")?.value ?? 0,
    water: list.find((w) => w.key === "水")?.value ?? 0,
  }
}
