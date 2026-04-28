export const runtime = "edge"

const GET_PROFILE_ENDPOINT =
  "https://www.highlight.url.tw/ai_fortune/php/get_user_fortune.php"
const SAVE_PROFILE_ENDPOINT =
  "https://www.highlight.url.tw/ai_fortune/php/sync_user.php"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const mid = url.searchParams.get("mid")

    if (!mid) {
      return Response.json({ message: "Missing mid" }, { status: 400 })
    }

    const upstream = await fetch(
      `${GET_PROFILE_ENDPOINT}?mid=${encodeURIComponent(mid)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    )

    const text = await upstream.text()

    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ??
          "application/json; charset=utf-8",
      },
    })
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Profile GET failed",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const upstream = await fetch(SAVE_PROFILE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    })

    const text = await upstream.text()

    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ??
          "application/json; charset=utf-8",
      },
    })
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Profile POST failed",
      },
      { status: 500 }
    )
  }
}
