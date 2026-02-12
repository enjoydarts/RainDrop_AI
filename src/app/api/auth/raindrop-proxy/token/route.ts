import { NextRequest, NextResponse } from "next/server"

/**
 * Raindrop.ioのトークンエンドポイントプロキシ
 * NextAuthが期待する標準OAuth2形式に変換
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    const code = params.get("code")
    const redirect_uri = params.get("redirect_uri")

    // 環境変数から直接取得（NextAuthは渡してくれない）
    const client_id = process.env.AUTH_RAINDROP_ID
    const client_secret = process.env.AUTH_RAINDROP_SECRET

    console.log("[raindrop-proxy] Token exchange request")
    console.log("[raindrop-proxy] Code:", code?.substring(0, 8))
    console.log("[raindrop-proxy] Redirect URI:", redirect_uri)
    console.log("[raindrop-proxy] Client ID:", client_id)
    console.log("[raindrop-proxy] Client Secret:", client_secret?.substring(0, 8))

    const requestBody = {
      grant_type: "authorization_code",
      code,
      client_id,
      client_secret,
      redirect_uri,
    }

    console.log("[raindrop-proxy] Request body:", JSON.stringify(requestBody))

    // Raindrop.io形式でリクエスト
    const raindropResponse = await fetch("https://raindrop.io/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[raindrop-proxy] Raindrop response status:", raindropResponse.status)

    if (!raindropResponse.ok) {
      const errorText = await raindropResponse.text()
      console.error("[raindrop-proxy] Error response:", errorText)
      return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
    }

    const raindropData = await raindropResponse.json()
    console.log("[raindrop-proxy] Raindrop response:", JSON.stringify(raindropData).substring(0, 200))

    // NextAuthが期待する標準OAuth2形式に変換
    const oauth2Response = {
      access_token: raindropData.access_token,
      token_type: raindropData.token_type || "Bearer",
      expires_in: raindropData.expires_in,
      refresh_token: raindropData.refresh_token,
      scope: raindropData.scope || "",
    }

    console.log("[raindrop-proxy] Sending OAuth2 response")

    return NextResponse.json(oauth2Response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("[raindrop-proxy] Error:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
