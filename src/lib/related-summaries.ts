import { db } from "@/db"
import { summaries, raindrops } from "@/db/schema"
import { eq, and, ne, isNull } from "drizzle-orm"
import { cosineSimilarity } from "./embeddings"

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

  // 他の要約を全て取得（削除済み・自分自身を除外）
  const otherSummaries = await db
    .select({
      id: summaries.id,
      articleTitle: raindrops.title,
      articleCover: raindrops.cover,
      summary: summaries.summary,
      tone: summaries.tone,
      rating: summaries.rating,
      createdAt: summaries.createdAt,
      embedding: summaries.embedding,
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
        eq(summaries.status, "completed")
      )
    )

  // 類似度を計算してソート
  const withSimilarity = otherSummaries
    .filter((s) => s.embedding) // 埋め込みがあるものだけ
    .map((s) => {
      const similarity = cosineSimilarity(currentEmbedding, s.embedding as number[])
      return {
        id: s.id,
        articleTitle: s.articleTitle,
        articleCover: s.articleCover,
        summary: s.summary,
        tone: s.tone,
        rating: s.rating,
        createdAt: s.createdAt,
        similarity,
      }
    })
    .sort((a, b) => b.similarity - a.similarity) // 類似度降順
    .slice(0, limit)

  return withSimilarity
}
