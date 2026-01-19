"use client"
import { useEffect, useRef } from "react"

export default function CosmicParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    const particles = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0,
      vy: 0,
      r: Math.random() * 1.2 + 0.5,
      alpha: Math.random() * 0.5 + 0.3,
    }))

    const animate = () => {
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      const scroll = Math.min(window.scrollY / 300, 1)

      particles.forEach(p => {
        const dx = cx - p.x
        const dy = cy - p.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        p.vx += (dx / dist) * 0.002
        p.vy += (dy / dist) * 0.002
        p.x += p.vx
        p.y += p.vy
        p.alpha = 0.2 + scroll * 0.6

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0" />
}
