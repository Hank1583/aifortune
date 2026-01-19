export interface FortuneResponse {
  uid: string
  date: string
  gz: {
    year: string
    month: string
    day: string
  }
  score: {
    overall: string
    wealth: string
    career: string
    invest: string
    relation: string
  }
  text: string
}

export function extractSection(text: string, emoji: string): string[] {
  const index = text.indexOf(emoji)
  if (index === -1) return []

  const nextEmojiIndex = text
    .slice(index + emoji.length)
    .search(/[\u{1F300}-\u{1FAFF}]/u)

  const sectionText =
    nextEmojiIndex === -1
      ? text.slice(index)
      : text.slice(index, index + emoji.length + nextEmojiIndex)

  return sectionText
    .split("\n")
    .slice(1)
    .map(line => line.trim())
    .filter(Boolean)
}

export async function fetchDailyFortune(
  uid: string,
  date: string
): Promise<FortuneResponse> {
  const params = new URLSearchParams({ uid })
  if (date) params.append("date", date)

  const res = await fetch(`https://www.highlight.url.tw/ai_fortune/php/sync_ai_daily.php?${params.toString()}`)

  if (!res.ok) {
    throw new Error("Failed to fetch daily fortune")
  }

  return res.json()
}
