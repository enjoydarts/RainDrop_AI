import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { authConfig } from "@/auth.config"
import type { NextAuthConfig } from "next-auth"

// Raindrop.io OAuth プロバイダー定義
const RaindropProvider = {
  id: "raindrop",
  name: "Raindrop.io",
  type: "oauth" as const,
  authorization: {
    url: "https://raindrop.io/oauth/authorize",
    params: {
      scope: "",
    },
  },
  token: {
    url: "https://raindrop.io/oauth/access_token",
    async request(context: any) {
      const { params, provider } = context

      console.log("[raindrop][token] Starting token exchange")
      console.log("[raindrop][token] Code:", params.code?.substring(0, 8))
      console.log("[raindrop][token] Redirect URI:", params.redirect_uri)

      const response = await fetch(provider.token.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code: params.code,
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          redirect_uri: params.redirect_uri,
        }),
      })

      console.log("[raindrop][token] Response status:", response.status)
      const responseText = await response.text()
      console.log("[raindrop][token] Response body:", responseText.substring(0, 200))

      const tokens = JSON.parse(responseText)

      return {
        tokens,
      }
    },
  },
  userinfo: "https://api.raindrop.io/rest/v1/user",
  clientId: process.env.AUTH_RAINDROP_ID,
  clientSecret: process.env.AUTH_RAINDROP_SECRET,
  profile(profile: any) {
    return {
      id: profile.user._id.toString(),
      name: profile.user.fullName || profile.user.email,
      email: profile.user.email,
      image: profile.user.avatar || null,
    }
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  providers: [RaindropProvider],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Raindrop.ioのトークンを暗号化してusersテーブルに保存
      if (account?.provider === "raindrop" && account.access_token && user.id) {
        // 動的インポート（Edge Runtimeの問題を回避）
        const { encrypt } = await import("@/lib/crypto")

        const encryptedAccessToken = encrypt(account.access_token)
        const encryptedRefreshToken = account.refresh_token
          ? encrypt(account.refresh_token)
          : null
        const expiresAt = account.expires_at
          ? new Date(account.expires_at * 1000)
          : null

        await db
          .update(users)
          .set({
            raindropAccessToken: encryptedAccessToken,
            raindropRefreshToken: encryptedRefreshToken,
            raindropTokenExpiresAt: expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))

        console.log("[auth] Raindrop tokens encrypted and saved for user:", user.id)
      }

      return true
    },
  },
  session: {
    strategy: "database",
  },
})
