import { inngest } from "../client"
import { db } from "@/db"
import { summaries, users } from "@/db/schema"
import { eq, and, isNull, sql } from "drizzle-orm"
import { generateBatchEmbeddings } from "@/lib/embeddings"
import { notifyUser } from "@/lib/ably"
import { decrypt } from "@/lib/crypto"
import { NonRetriableError } from "inngest"

const BATCH_SIZE = 100

/**
 * エンベディング一括再生成ジョブ
 * embedding が NULL の完了済み要約にまとめてエンベディングを付与する
 */
export const regenerateEmbeddings = inngest.createFunction(
  {
    id: "regenerate-embeddings",
    retries: 1,
    concurrency: [
      { limit: 2 },                          // グローバル: 最大2ジョブ
      { limit: 1, key: "event.data.userId" }, // ユーザー単位: 1ジョブ
    ],
    timeouts: {
      finish: "30m", // 最大30分
    },
  },
  { event: "embeddings/regenerate.requested" },
  async ({ event, step }) => {
    const { userId } = event.data

    // OpenAI APIキーを取得
    const openaiApiKey = await step.run("fetch-api-key", async () => {
      const [user] = await db
        .select({ openaiApiKeyEncrypted: users.openaiApiKeyEncrypted })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) throw new NonRetriableError(`User not found: ${userId}`)
      if (!user.openaiApiKeyEncrypted) {
        throw new NonRetriableError("OpenAI API key is not configured")
      }

      return decrypt(user.openaiApiKeyEncrypted)
    })

    // エンベディング未生成の完了済み要約を取得
    const targets = await step.run("fetch-targets", async () => {
      return await db
        .select({
          id: summaries.id,
          summary: summaries.summary,
        })
        .from(summaries)
        .where(
          and(
            eq(summaries.userId, userId),
            eq(summaries.status, "completed"),
            isNull(summaries.deletedAt),
            sql`${summaries.embedding} IS NULL`
          )
        )
        .orderBy(summaries.createdAt)
    })

    if (targets.length === 0) {
      return { success: true, processed: 0, message: "No summaries need embedding" }
    }

    console.log(`[regenerate-embeddings] Processing ${targets.length} summaries for user ${userId}`)

    let totalProcessed = 0
    let totalFailed = 0
    const batchCount = Math.ceil(targets.length / BATCH_SIZE)

    // バッチ単位で処理（Inngest step で耐障害性を確保）
    for (let i = 0; i < batchCount; i++) {
      const batch = targets.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)

      await step.run(`process-batch-${i + 1}-of-${batchCount}`, async () => {
        const texts = batch.map((s) => s.summary)

        let embeddings: number[][]
        try {
          embeddings = await generateBatchEmbeddings(texts, {
            apiKey: openaiApiKey,
            userId,
          })
        } catch (err) {
          console.error(`[regenerate-embeddings] Batch ${i + 1} failed:`, err)
          totalFailed += batch.length
          return
        }

        // DBに保存
        await Promise.all(
          batch.map((s, idx) => {
            const embedding = embeddings[idx]
            if (!embedding || embedding.length === 0) {
              totalFailed++
              return Promise.resolve()
            }
            totalProcessed++
            return db
              .update(summaries)
              .set({ embedding, updatedAt: new Date() })
              .where(eq(summaries.id, s.id))
          })
        )

        console.log(
          `[regenerate-embeddings] Batch ${i + 1}/${batchCount}: ${batch.length} processed`
        )
      })
    }

    // 完了通知
    await step.run("notify-completion", async () => {
      await notifyUser(userId, "embeddings:completed", {
        processed: totalProcessed,
        failed: totalFailed,
        total: targets.length,
      })
    })

    return {
      success: true,
      processed: totalProcessed,
      failed: totalFailed,
      total: targets.length,
    }
  }
)

// NonRetriableError は上のスコープで catch できないため、
// Inngest の onFailure フックでエラー通知を送る
export const regenerateEmbeddingsFailure = inngest.createFunction(
  { id: "regenerate-embeddings-failure" },
  { event: "inngest/function.failed" },
  async ({ event, step }) => {
    if (event.data.function_id !== "regenerate-embeddings") return

    const userId = event.data.event?.data?.userId
    if (!userId) return

    await step.run("notify-failure", async () => {
      await notifyUser(userId, "embeddings:failed", {
        error: event.data.error?.message || "エラーが発生しました",
      })
    })
  }
)
