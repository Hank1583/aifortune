// components/CosmicSphere/CosmicSphere.tsx
import { WUXING_THEME } from "./wuxingTheme"
import CosmicParticles from "./CosmicParticles"
import EnergyCore from "./EnergyCore"

export type TodayFortune = {
  date: string
  ganzhi: string
  element: "wood" | "fire" | "earth" | "metal" | "water"
  wuxingCount: {
    wood: number
    fire: number
    earth: number
    metal: number
    water: number
  }
}

export default function CosmicSphere({
  todayFortune,
}: {
  todayFortune: TodayFortune
}) {
  const theme = WUXING_THEME[todayFortune.element]

  return (
    <section className="relative min-h-screen bg-black">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(
            circle at center,
            ${theme.color}22 0%,
            #020617 40%,
            #020617 60%,
            #000 100%
          )`,
        }}
      />

      <CosmicParticles />

      <div className="relative z-10 flex h-screen items-center justify-center">
        <EnergyCore glow={theme.glow} />
      </div>
    </section>
  )
}
