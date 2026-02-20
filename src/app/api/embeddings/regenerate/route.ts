import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { summaries } from "@/db/schema"
import { eq, and, isNull, sql } from "drizzle-orm"
import { inngest } from "@/inngest/client"

/**
 * GET /api/embeddings/regenerate
 * エンベディング未生成の要約件数を返す
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(summaries)
    .where(
      and(
        eq(summaries.userId, userId),
        eq(summaries.status, "completed"),
        isNull(summaries.deletedAt),
        sql`${summaries.embedding} IS NULL`
      )
    )

  return NextResponse.json({ count: result?.count ?? 0 })
}

/**
 * POST /api/embeddings/regenerate
 * バックグラウンドでエンベディング一括生成ジョブを起動
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  await inngest.send({
    name: "embeddings/regenerate.requested",
    data: { userId },
  })

  return NextResponse.json({ ok: true, message: "エンベディング生成ジョブを開始しました" })
}
