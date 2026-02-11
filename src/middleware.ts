import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公開ページ（認証不要）
  const publicPaths = ["/login", "/api/auth/raindrop"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  // セッションCookieをチェック
  const sessionCookie = request.cookies.get("raindrop-session")

  // ダッシュボードなど保護されたページ
  if (pathname.startsWith("/dashboard")) {
    console.log("[middleware] Checking session for /dashboard")
    console.log("[middleware] Session cookie exists:", !!sessionCookie)
    console.log("[middleware] All cookies:", request.cookies.getAll().map(c => c.name))

    if (!sessionCookie) {
      // セッションがない場合はログインページにリダイレクト
      console.log("[middleware] No session cookie, redirecting to /login")
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    // セッションCookieが有効か確認
    try {
      const session = JSON.parse(sessionCookie.value)
      console.log("[middleware] Valid session for user:", session.email)
      return NextResponse.next()
    } catch {
      // 無効なセッションCookieの場合はログインページにリダイレクト
      console.log("[middleware] Invalid session cookie, redirecting to /login")
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
