import { inngest } from "../client"
import { db } from "@/db"
import { raindrops, summaries, summaryJobs } from "@/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { NonRetriableError } from "inngest"

interface ExtractResponse {
  title: string
  text: string
  length: number
  language: string
  method: string
}

/**
 * 記事本文抽出関数
 */
export const raindropExtract = inngest.createFunction(
  {
    id: "raindrop-extract",
    retries: 2,
    concurrency: [
      { limit: 5 }, // グローバル: 最大5ジョブ（無料プラン制限）
      { limit: 2, key: "event.data.userId" }, // ユーザー単位: 2ジョブ
    ],
  },
  { event: "raindrop/item.extract.requested" },
  async ({ event, step }) => {
    const { userId, raindropId, summaryId, tone = "neutral" } = event.data

    await step.run("mark-job-processing", async () => {
      if (summaryId) {
        await db
          .update(summaryJobs)
          .set({
            status: "processing",
            error: null,
            lastRunAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          })
          .where(and(eq(summaryJobs.userId, userId), eq(summaryJobs.summaryId, summaryId)))
        return
      }

      await db
        .insert(summaryJobs)
        .values({
          userId,
          raindropId,
          tone: tone as "snarky" | "neutral" | "enthusiastic" | "casual",
          status: "processing",
          error: null,
          lastRunAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        })
        .onConflictDoUpdate({
          target: [summaryJobs.userId, summaryJobs.raindropId, summaryJobs.tone],
          set: {
            status: "processing",
            error: null,
            lastRunAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        })
    })

    // Raindropを取得
    const raindrop = await step.run("fetch-raindrop", async () => {
      const [record] = await db
        .select()
        .from(raindrops)
        .where(and(eq(raindrops.userId, userId), eq(raindrops.id, raindropId)))
        .limit(1)

      if (!record) {
        throw new NonRetriableError(
          `Raindrop not found: userId=${userId}, raindropId=${raindropId}`
        )
      }

      return record
    })

    // Python抽出サービスを呼び出し
    let extractResult: ExtractResponse
    try {
      extractResult = await step.run("extract-content", async () => {
        const extractUrl = process.env.EXTRACT_API_URL || "http://extract:8000/extract"

        const response = await fetch(extractUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: raindrop.link,
          }),
        })

        if (!response.ok) {
          const error = await response.text()

          // 404や422は記事として抽出できないので、リトライしない
          if (response.status === 404 || response.status === 422) {
            throw new NonRetriableError(
              `Content extraction failed (${response.status}): ${error}`
            )
          }

          throw new Error(`Extract service error (${response.status}): ${error}`)
        }

        const data: ExtractResponse = await response.json()
        return data
      })
    } catch (error) {
      // extractで失敗した場合、summaryがあれば更新
      if (summaryId) {
        await step.run("update-summary-failed", async () => {
          const errorMessage =
            error instanceof NonRetriableError
              ? error.message
              : `記事の内容を取得できませんでした: ${error instanceof Error ? error.message : String(error)}`

          await db
            .update(summaries)
            .set({
              status: "failed",
              error: errorMessage,
              updatedAt: new Date(),
            })
            .where(eq(summaries.id, summaryId))

          await db
            .update(summaryJobs)
            .set({
              status: "failed",
              error: errorMessage,
              updatedAt: new Date(),
            })
            .where(and(eq(summaryJobs.userId, userId), eq(summaryJobs.summaryId, summaryId)))
        })
      } else {
        await step.run("update-job-failed", async () => {
          const errorMessage =
            error instanceof NonRetriableError
              ? error.message
              : `記事の内容を取得できませんでした: ${error instanceof Error ? error.message : String(error)}`
          await db
            .update(summaryJobs)
            .set({
              status: "failed",
              error: errorMessage,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(summaryJobs.userId, userId),
                eq(summaryJobs.raindropId, raindropId),
                eq(summaryJobs.tone, tone),
                isNull(summaryJobs.deletedAt)
              )
            )
        })
      }
      // エラーを再スロー
      throw error
    }

    // 抽出結果を全文保存
    await step.run("save-extracted-text", async () => {
      await db
        .update(raindrops)
        .set({
          excerpt: extractResult.text, // 全文を保存
        })
        .where(and(eq(raindrops.userId, userId), eq(raindrops.id, raindropId)))
    })

    // 要約生成イベントを発火
    await step.run("trigger-summarize", async () => {
      await inngest.send({
        name: "raindrop/item.summarize.requested",
        data: {
          userId,
          raindropId,
          summaryId: summaryId || undefined, // summaryIdがあれば渡す
          tone: tone as "snarky" | "neutral" | "enthusiastic" | "casual",
        },
      })
    })

    return {
      success: true,
      userId,
      raindropId,
      extractedLength: extractResult.length,
      language: extractResult.language,
    }
  }
)
