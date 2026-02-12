import { cookies } from "next/headers"
import { db } from "@/db"
import { sessions, users } from "@/db/schema"
import { eq, and, gt } from "drizzle-orm"

export type SessionUser = {
  id: string
  email: string
  name: string | null
  image: string | null
}

/**
 * 現在のセッションからユーザー情報を取得
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("raindrop-session")

  if (!sessionCookie) {
    return null
  }

  const sessionId = sessionCookie.value

  try {
    // セッションをDBから取得（有効期限チェック付き）
    const [session] = await db
      .select({
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
      .limit(1)

    if (!session) {
      return null
    }

    // ユーザー情報を取得
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    return user || null
  } catch (error) {
    console.error("[session] Error getting session user:", error)
    return null
  }
}

/**
 * セッションが存在するかチェック
 */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}
