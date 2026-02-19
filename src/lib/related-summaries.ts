import { db } from "@/db"
import { summaries, raindrops } from "@/db/schema"
import { eq, and, ne, isNull, sql } from "drizzle-orm"

export interface RelatedSummary {
  id: string
  articleTitle: string | null
  articleCover: string | null
  summary: string
  tone: string
  rating: number | null
  createdAt: Date
  similarity: number
}

/**
 * 指定された要約に関連する要約を取得
 */
export async function getRelatedSummaries(
  userId: string,
  summaryId: string,
  limit: number = 3
): Promise<RelatedSummary[]> {
  // 現在の要約を取得
  const [currentSummary] = await db
    .select({
      embedding: summaries.embedding,
    })
    .from(summaries)
    .where(and(eq(summaries.id, summaryId), eq(summaries.userId, userId)))
    .limit(1)

  if (!currentSummary || !currentSummary.embedding) {
    // 埋め込みがない場合は空配列を返す
    return []
  }

  const currentEmbedding = currentSummary.embedding as number[]
  const vectorString = `[${currentEmbedding.join(",")}]`

  const related = await db
    .select({
      id: summaries.id,
      articleTitle: raindrops.title,
      articleCover: raindrops.cover,
      summary: summaries.summary,
      tone: summaries.tone,
      rating: summaries.rating,
      createdAt: summaries.createdAt,
      similarity: sql<number>`1 - (${summaries.embedding} <=> ${vectorString}::vector)`,
    })
    .from(summaries)
    .innerJoin(
      raindrops,
      and(eq(summaries.raindropId, raindrops.id), eq(summaries.userId, raindrops.userId))
    )
    .where(
      and(
        eq(summaries.userId, userId),
        ne(summaries.id, summaryId),
        isNull(summaries.deletedAt),
        eq(summaries.status, "completed"),
        sql`${summaries.embedding} IS NOT NULL`
      )
    )
    .orderBy(sql`${summaries.embedding} <=> ${vectorString}::vector`)
    .limit(limit)

  return related
}
