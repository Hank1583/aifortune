"use client"

const VIP_UPGRADE_URL = "https://www.highlight.url.tw/shop/index.html#"

type UpgradePromptProps = {
  title?: string
  description?: string
  className?: string
}

export default function UpgradePrompt({
  title = "升級 VIP 解鎖完整內容",
  description = "VIP 可查看完整運勢解析、趨勢曲線、彩券建議與命盤深度分析。",
  className = "",
}: UpgradePromptProps) {
  return (
    <div
      className={`rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 ${className}`}
    >
      <div className="text-sm font-semibold text-yellow-100">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-yellow-100/75">
        {description}
      </div>
      <a
        href={VIP_UPGRADE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block w-full rounded-lg bg-yellow-400/20 py-2 text-center text-sm font-semibold text-yellow-100 transition hover:bg-yellow-400/30"
      >
        前往升級 VIP
      </a>
    </div>
  )
}
