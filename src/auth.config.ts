import type { NextAuthConfig } from "next-auth"

/**
 * Edge Runtime対応のNextAuth設定
 * ミドルウェアで使用
 */
const PROTECTED_PATHS = [
  "/dashboard",
  "/raindrops",
  "/summaries",
  "/themes",
  "/jobs",
  "/stats",
  "/notifications",
  "/settings",
]

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected = PROTECTED_PATHS.some((path) =>
        nextUrl.pathname.startsWith(path)
      )

      if (isProtected && !isLoggedIn) {
        console.log("[middleware][authorized] Redirecting to login:", nextUrl.pathname)
        return false
      }

      return true
    },
  },
  providers: [], // ミドルウェアではプロバイダー不要
}
