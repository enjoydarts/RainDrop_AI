import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { withRLS } from "@/db/rls"
import { users, summaries } from "@/db/schema"
import { eq, and, isNull, sql } from "drizzle-orm"
import { getRaindropCollections } from "@/lib/raindrop-api"
import { SettingsForm } from "./settings-form"
import { RegenerateEmbeddingsButton } from "@/components/RegenerateEmbeddingsButton"

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id

  const [userSettings, embeddingMissingCount] = await withRLS(userId, async (tx) => {
    const [user] = await tx
      .select({
        monthlyBudgetUsd: users.monthlyBudgetUsd,
        defaultSummaryTone: users.defaultSummaryTone,
        notificationsEnabled: users.notificationsEnabled,
        defaultImportCollectionId: users.defaultImportCollectionId,
        hasAnthropicApiKey: users.anthropicApiKeyEncrypted,
        hasOpenaiApiKey: users.openaiApiKeyEncrypted,
        factsExtractionModel: users.factsExtractionModel,
        summaryGenerationModel: users.summaryGenerationModel,
        raindropAccessToken: users.raindropAccessToken,
      })
      .from(users)
      .limit(1)

    if (!user) {
      throw new Error("User not found")
    }

    const [countResult] = await tx
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

    return [user, countResult?.count ?? 0] as const
  })

  let collections: Array<{ id: number; name: string }> = []
  if (userSettings.raindropAccessToken) {
    try {
      const result = await getRaindropCollections(userSettings.raindropAccessToken)
      collections = result.map((item) => ({ id: item._id, name: item.title }))
    } catch (error) {
      console.error("[settings] Failed to load collections:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          アカウント設定
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          要約・通知・同期の既定動作を設定できます
        </p>
      </div>

      <SettingsForm
        initialBudgetUsd={Number(userSettings.monthlyBudgetUsd || 0)}
        initialTone={userSettings.defaultSummaryTone || "neutral"}
        initialNotificationsEnabled={userSettings.notificationsEnabled === 1}
        initialCollectionId={userSettings.defaultImportCollectionId || null}
        hasAnthropicApiKey={Boolean(userSettings.hasAnthropicApiKey)}
        hasOpenaiApiKey={Boolean(userSettings.hasOpenaiApiKey)}
        initialFactsExtractionModel={userSettings.factsExtractionModel}
        initialSummaryGenerationModel={userSettings.summaryGenerationModel}
        collections={collections}
      />

      {/* データ管理 */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">データ管理</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            意味検索・関連記事・テーマ分類に必要なデータのメンテナンス
          </p>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            エンベディング一括生成
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            意味検索・関連記事機能はエンベディング（ベクトル表現）が必要です。
            APIキーを後から設定した場合や、過去の要約に未生成のものがある場合にまとめて生成できます。
          </p>
          <div className="pt-2">
            <RegenerateEmbeddingsButton
              initialCount={embeddingMissingCount}
              hasOpenaiApiKey={Boolean(userSettings.hasOpenaiApiKey)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
