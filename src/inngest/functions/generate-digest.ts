import { inngest } from "../client"
import { db } from "@/db"
import { summaries, raindrops, users, digests } from "@/db/schema"
import { eq, and, gte, lt, isNull, desc } from "drizzle-orm"
import { decrypt } from "@/lib/crypto"
import { trackAnthropicUsage } from "@/lib/cost-tracker"
import Anthropic from "@anthropic-ai/sdk"

/**
 * 週次ダイジェスト生成（毎週月曜 JST 00:00）
 * 先週1週間の要約をAIがメタ分析してダイジェストを生成
 */
export const generateWeeklyDigest = inngest.createFunction(
  {
    id: "generate-weekly-digest",
    retries: 2,
    concurrency: { limit: 3 },
  },
  { cron: "TZ=Asia/Tokyo 0 0 * * 1" }, // 毎週月曜 JST 00:00
  async ({ step, logger }) => {
    // 先週の期間を計算
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setHours(0, 0, 0, 0)
    const periodStart = new Date(periodEnd)
    periodStart.setDate(periodStart.getDate() - 7)

    logger.info("Generating weekly digests", {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    })

    // 先週に完了した要約を持つユーザーを取得
    const activeUsers = await step.run("fetch-active-users", async () => {
      const rows = await db
        .selectDistinct({ userId: summaries.userId })
        .from(summaries)
        .where(
          and(
            isNull(summaries.deletedAt),
            eq(summaries.status, "completed"),
            gte(summaries.createdAt, periodStart),
            lt(summaries.createdAt, periodEnd)
          )
        )
      return rows.map((r) => r.userId)
    })

    logger.info(`Found ${activeUsers.length} active users for digest`)

    const results = []

    for (const userId of activeUsers) {
      const result = await step.run(`generate-digest-${userId}`, async () => {
        // ユーザーのAPIキーを取得
        const [user] = await db
          .select({ anthropicApiKeyEncrypted: users.anthropicApiKeyEncrypted })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        if (!user?.anthropicApiKeyEncrypted) {
          return { userId, skipped: true, reason: "no_api_key" }
        }

        const apiKey = decrypt(user.anthropicApiKeyEncrypted)

        // 先週の要約を取得（記事情報と結合）
        const weeklySummaries = await db
          .select({
            summary: summaries.summary,
            tone: summaries.tone,
            theme: summaries.theme,
            rating: summaries.rating,
            articleTitle: raindrops.title,
            createdAt: summaries.createdAt,
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
              isNull(summaries.deletedAt),
              eq(summaries.status, "completed"),
              gte(summaries.createdAt, periodStart),
              lt(summaries.createdAt, periodEnd)
            )
          )
          .orderBy(desc(summaries.createdAt))
          .limit(50)

        if (weeklySummaries.length === 0) {
          return { userId, skipped: true, reason: "no_summaries" }
        }

        // トップテーマを集計
        const themeCount = new Map<string, number>()
        weeklySummaries.forEach((s) => {
          if (s.theme) {
            themeCount.set(s.theme, (themeCount.get(s.theme) || 0) + 1)
          }
        })
        const topThemes = Array.from(themeCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([theme]) => theme)

        // Claude でダイジェストを生成
        const summaryTexts = weeklySummaries
          .map(
            (s, i) =>
              `${i + 1}. 【${s.articleTitle}】${s.theme ? `(テーマ: ${s.theme})` : ""}\n${s.summary}`
          )
          .join("\n\n")

        const prompt = `以下は先週（${periodStart.toLocaleDateString("ja-JP")} 〜 ${new Date(periodEnd.getTime() - 1).toLocaleDateString("ja-JP")}）に読んだ記事の要約${weeklySummaries.length}件です。

${summaryTexts}

これらの要約を分析して、以下の形式で週次ダイジェストを日本語で作成してください：

## 今週の読書トレンド

（全体的な傾向・共通テーマを2〜3文で）

## 注目トピック

（特に重要または繰り返し登場したテーマを箇条書きで3〜5個）

## 学びのポイント

（今週の読書から得られた重要な洞察を2〜3個）

## 来週へのおすすめ

（今週の読書傾向から、来週読むとよい分野や視点の提案）`

        const client = new Anthropic({ apiKey })
        const message = await client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        })

        const content = message.content[0]
        if (content.type !== "text") {
          return { userId, skipped: true, reason: "unexpected_response" }
        }

        // コストトラッキング
        await trackAnthropicUsage({
          userId,
          model: "claude-haiku-4-5",
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        }).catch((err) => logger.warn("Failed to track digest cost", { err }))

        // ダイジェストを保存
        await db.insert(digests).values({
          userId,
          period: "weekly",
          periodStart,
          periodEnd,
          content: content.text,
          summaryCount: weeklySummaries.length,
          topThemes,
        })

        return { userId, success: true, summaryCount: weeklySummaries.length }
      })

      results.push(result)
    }

    return {
      period: "weekly",
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      results,
    }
  }
)
