"use client"

import { useState } from "react"

import CosmicSphere from "@/components/CosmicSphere/CosmicSphere"
import type { TodayFortune } from "@/components/CosmicSphere/CosmicSphere"

import TopNav from "@/components/layout/TopNav"
import ContentPanel from "@/components/layout/ContentPanel"

import DailyWuxing from "@/components/pages/HomePage"
import DailyFortune from "@/components/pages/DailyFortune"
import CalendarView from "@/components/pages/CalendarView"
import MonthView from "@/components/pages/MonthView"
import ProfileView from "@/components/pages/ProfileView"

import { useFortuneData } from "@/components/data/HomePage"
import { useAuth } from "@/contexts/AuthContext"

type TabKey = "wuxing" | "fortune" | "calendar" | "month" | "profile"
type WuxingKey = "木" | "火" | "土" | "金" | "水"

export default function HomePage() {
  const [tab, setTab] = useState<TabKey>("wuxing")
  const { data, isLoading } = useFortuneData()
  useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </main>
    )
  }

  if (!data?.today) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        No data
      </main>
    )
  }

  const activeTab = tab

  const todayFortune: TodayFortune = {
    date: data.today.date,
    ganzhi: data.today.ganzhi,
    element: mapDominantToElement(data.today.dominant as WuxingKey),
    wuxingCount: toWuxingCount(
      data.today.wuxing as Array<{ key: WuxingKey; value: number }>
    ),
  }

  return (
    <main className="home-root w-full">
      <div className="relative w-full overflow-hidden">
        <CosmicSphere todayFortune={todayFortune} />
      </div>

      <TopNav
        active={activeTab}
        onChange={setTab}
      />

      <ContentPanel className="w-full">
        {activeTab === "wuxing" && <DailyWuxing />}
        {activeTab === "fortune" && <DailyFortune />}
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "month" && <MonthView />}
        {activeTab === "profile" && <ProfileView />}
      </ContentPanel>
    </main>
  )
}

function mapDominantToElement(dominant: WuxingKey): TodayFortune["element"] {
  const map: Record<WuxingKey, TodayFortune["element"]> = {
    木: "wood",
    火: "fire",
    土: "earth",
    金: "metal",
    水: "water",
  }

  return map[dominant]
}

function toWuxingCount(
  list: Array<{ key: WuxingKey; value: number }>
): TodayFortune["wuxingCount"] {
  return {
    wood: list.find((item) => item.key === "木")?.value ?? 0,
    fire: list.find((item) => item.key === "火")?.value ?? 0,
    earth: list.find((item) => item.key === "土")?.value ?? 0,
    metal: list.find((item) => item.key === "金")?.value ?? 0,
    water: list.find((item) => item.key === "水")?.value ?? 0,
  }
}
