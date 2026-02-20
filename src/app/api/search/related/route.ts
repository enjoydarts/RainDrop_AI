import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { summaries, raindrops } from "@/db/schema"
import { eq, and, ne, isNull, sql } from "drizzle-orm"

/**
 * 関連記事検索API（エンベディング再利用）
 * GET /api/search/related?summaryId=X&limit=5
 * 指定した要約のエンベディングを使って類似要約を返す（OpenAI API呼び出し不要）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const summaryId = searchParams.get("summaryId")
    const limit = Math.min(parseInt(searchParams.get("limit") || "5", 10), 20)

    if (!summaryId) {
      return NextResponse.json(
        { error: "summaryId parameter is required" },
        { status: 400 }
      )
    }

    // 対象要約のエンベディングを取得
    const [target] = await db
      .select({ embedding: summaries.embedding, theme: summaries.theme })
      .from(summaries)
      .where(
        and(
          eq(summaries.id, summaryId),
          eq(summaries.userId, userId)
        )
      )
      .limit(1)

    if (!target) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 })
    }

    if (!target.embedding || target.embedding.length === 0) {
      return NextResponse.json({ results: [], count: 0 })
    }

    const vectorString = `[${target.embedding.join(",")}]`

    const results = await db
      .select({
        summaryId: summaries.id,
        raindropId: summaries.raindropId,
        title: raindrops.title,
        summary: summaries.summary,
        tone: summaries.tone,
        theme: summaries.theme,
        rating: summaries.rating,
        createdAt: summaries.createdAt,
        similarity: sql<number>`1 - (${summaries.embedding} <=> ${vectorString}::vector)`,
      })
      .from(summaries)
      .innerJoin(
        raindrops,
        and(
          eq(summaries.raindropId, raindrops.id),
          eq(summaries.userId, raindrops.userId)
        )
      )
      .where(
        and(
          eq(summaries.userId, userId),
          ne(summaries.id, summaryId),
          eq(summaries.status, "completed"),
          isNull(summaries.deletedAt),
          sql`${summaries.embedding} IS NOT NULL`
        )
      )
      .orderBy(sql`${summaries.embedding} <=> ${vectorString}::vector`)
      .limit(limit)

    const filteredResults = results
      .filter((r) => r.similarity >= 0.6)
      .map((r) => ({
        summaryId: r.summaryId,
        raindropId: r.raindropId,
        title: r.title,
        summary: r.summary.length > 150 ? r.summary.slice(0, 150) + "…" : r.summary,
        tone: r.tone,
        theme: r.theme,
        rating: r.rating,
        createdAt: r.createdAt,
        similarity: r.similarity,
      }))

    return NextResponse.json({ results: filteredResults, count: filteredResults.length })
  } catch (error) {
    console.error("[related-search] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
