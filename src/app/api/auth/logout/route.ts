import { NextRequest, NextResponse } from "next/server"

/**
 * ログアウト処理
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url))

  // セッションCookieを削除
  response.cookies.delete("raindrop-session")

  console.log("[logout] Session cookie deleted, redirecting to /login")

  return response
}
