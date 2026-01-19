// components/CosmicSphere/EnergyCore.tsx
export default function EnergyCore({ glow }: { glow: string }) {
  return (
    <div
      className="w-52 h-52 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 30% 30%, #ffffff33, transparent 70%)",
        animation: "energyPulse 4s ease-in-out infinite",
        boxShadow: `0 0 50px ${glow}`,
        ["--glow" as any]: glow,
      }}
    />
  )
}
