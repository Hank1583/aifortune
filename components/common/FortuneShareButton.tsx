"use client"

import { useState } from "react"

type FortuneShareButtonProps = {
  title: string
  text: string
  urlHash?: string
  className?: string
}

export default function FortuneShareButton({
  title,
  text,
  urlHash,
  className = "",
}: FortuneShareButtonProps) {
  const [feedback, setFeedback] = useState("")

  const resetFeedback = () => {
    window.setTimeout(() => setFeedback(""), 2200)
  }

  const handleShare = async () => {
    const url =
      typeof window === "undefined"
        ? ""
        : `${window.location.origin}${window.location.pathname}${urlHash ?? ""}`

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        setFeedback("已開啟分享")
        resetFeedback()
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`.trim())
        setFeedback("已複製分享內容")
        resetFeedback()
        return
      }

      throw new Error("share_not_supported")
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }

      setFeedback("這台裝置目前不支援分享")
      resetFeedback()
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleShare}
        className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/85 transition hover:bg-white/12"
      >
        分享
      </button>

      {feedback && <span className="text-xs text-white/55">{feedback}</span>}
    </div>
  )
}
