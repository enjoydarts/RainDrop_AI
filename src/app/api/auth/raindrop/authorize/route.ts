import { NextRequest, NextResponse } from "next/server"

/**
 * Raindrop.io OAuth 認証開始
 */
export async function GET(request: NextRequest) {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/raindrop/callback`

  console.log("[raindrop][authorize] NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
  console.log("[raindrop][authorize] redirect_uri:", redirectUri)

  const params = new URLSearchParams({
    client_id: process.env.AUTH_RAINDROP_ID || "",
    redirect_uri: redirectUri,
  })

  const authorizeUrl = `https://raindrop.io/oauth/authorize?${params.toString()}`

  console.log("[raindrop][authorize] Redirecting to:", authorizeUrl)

  return NextResponse.redirect(authorizeUrl)
}
