import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { summaries } from "@/db/schema"
import { eq, isNotNull, sql } from "drizzle-orm"
import { getAuthUser } from "@/lib/auth-context"

/**
 * ユーザーの要約に存在するテーマ一覧を取得
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ユーザーの要約からユニークなテーマを取得
    const themes = await db
      .selectDistinct({ theme: summaries.theme })
      .from(summaries)
      .where(eq(summaries.userId, user.id))
      .where(isNotNull(summaries.theme))
      .orderBy(summaries.theme)

    return NextResponse.json({
      themes: themes.map((t) => t.theme).filter((t): t is string => t !== null),
    })
  } catch (error) {
    console.error("[themes] Failed to fetch themes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
