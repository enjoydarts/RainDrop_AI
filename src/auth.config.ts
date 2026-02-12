import type { NextAuthConfig } from "next-auth"

/**
 * Edge Runtime対応のNextAuth設定
 * ミドルウェアで使用
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // ログインページにリダイレクト
      }

      return true
    },
  },
  providers: [], // ミドルウェアではプロバイダー不要
}
