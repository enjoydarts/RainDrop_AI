import { auth } from "@/auth"
import { withRLS } from "@/db/rls"
import { raindrops, summaries, apiUsage, users } from "@/db/schema"
import { count, sum, isNull, and, gte, sql, desc } from "drizzle-orm"
import Link from "next/link"
import { Newspaper, FileText, ChevronRight, ClipboardList, Zap, Flame, MessageCircle, Check, X, Loader2, Clock, Folder } from "lucide-react"
import { getRaindropCollections, createCollectionMap } from "@/lib/raindrop-api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { maskSession } from "@/lib/logger"
import { ImportButton } from "../raindrops/import-button"

const TONE_LABELS = {
  neutral: { label: "客観的", Icon: ClipboardList },
  snarky: { label: "毒舌", Icon: Zap },
  enthusiastic: { label: "熱量高め", Icon: Flame },
  casual: { label: "カジュアル", Icon: MessageCircle },
} as const

const STATUS_LABELS = {
  completed: { label: "完了", Icon: Check, className: "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-950/50" },
  failed: { label: "失敗", Icon: X, className: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-950/50" },
  processing: { label: "処理中", Icon: Loader2, className: "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-950/50" },
  pending: { label: "待機中", Icon: Clock, className: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" },
} as const

export default async function DashboardPage() {
  const session = await auth()

  console.log("[dashboard] Session from auth():", JSON.stringify(maskSession(session), null, 2))

  // ミドルウェアで既に認証済みなので、ここでは必ず session.user が存在する
  const user = session!.user
  const userId = user.id!

  // RLS対応: 統計情報を取得
  const { raindropCount, summaryCount, monthlyCost, monthlyUsageByProvider, recentSummaries, statusCounts, nextToRead, budgetUsd, collectionStats, raindropAccessToken } = await withRLS(
    userId,
    async (tx) => {
      // 統計情報を取得（RLSで自動的にユーザーのデータのみ取得）
      const [raindropCount] = await tx
        .select({ count: count() })
        .from(raindrops)
        .where(isNull(raindrops.deletedAt))

      const [summaryCount] = await tx.select({ count: count() }).from(summaries)

      // 今月のAPI使用量（プロバイダー別）
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const monthlyUsageByProvider = await tx
        .select({
          provider: apiUsage.apiProvider,
          total: sum(apiUsage.costUsd),
        })
        .from(apiUsage)
        .where(gte(apiUsage.createdAt, firstDayOfMonth))
        .groupBy(apiUsage.apiProvider)

      const [monthlyCost] = await tx
        .select({ total: sum(apiUsage.costUsd) })
        .from(apiUsage)
        .where(gte(apiUsage.createdAt, firstDayOfMonth))

      const [userBudget] = await tx
        .select({ monthlyBudgetUsd: users.monthlyBudgetUsd })
        .from(users)
        .limit(1)

      // 最近の要約を取得（記事情報も含む、削除済みを除外）
      const recentSummaries = await tx
        .select({
          id: summaries.id,
          raindropId: summaries.raindropId,
          tone: summaries.tone,
          status: summaries.status,
          createdAt: summaries.createdAt,
          summary: summaries.summary,
          articleTitle: raindrops.title,
        })
        .from(summaries)
        .leftJoin(raindrops, sql`${summaries.raindropId} = ${raindrops.id}`)
        .where(sql`${summaries.deletedAt} IS NULL`)
        .orderBy(sql`${summaries.updatedAt} DESC`)
        .limit(3)

      const statusCounts = await tx
        .select({
          status: summaries.status,
          count: count(),
        })
        .from(summaries)
        .where(sql`${summaries.deletedAt} IS NULL`)
        .groupBy(summaries.status)

      const nextToRead = await tx
        .select({
          id: raindrops.id,
          title: raindrops.title,
          createdAtRemote: raindrops.createdAtRemote,
        })
        .from(raindrops)
        .where(
          and(
            isNull(raindrops.deletedAt),
            sql`NOT EXISTS (
              SELECT 1 FROM summaries s
              WHERE s.user_id = ${raindrops.userId}
                AND s.raindrop_id = ${raindrops.id}
                AND s.status = 'completed'
                AND s.deleted_at IS NULL
            )`
          )
        )
        .orderBy(sql`${raindrops.createdAtRemote} DESC`)
        .limit(5)

      // コレクション別記事数を取得
      const collectionStats = await tx
        .select({
          collectionId: raindrops.collectionId,
          count: count(),
        })
        .from(raindrops)
        .where(isNull(raindrops.deletedAt))
        .groupBy(raindrops.collectionId)
        .orderBy(desc(count()))
        .limit(6)

      const [raindropUser] = await tx
        .select({ raindropAccessToken: users.raindropAccessToken })
        .from(users)
        .limit(1)

      return {
        raindropCount,
        summaryCount,
        monthlyCost,
        monthlyUsageByProvider,
        recentSummaries,
        statusCounts,
        nextToRead,
        budgetUsd: userBudget?.monthlyBudgetUsd ? Number(userBudget.monthlyBudgetUsd) : Number(process.env.DEFAULT_MONTHLY_BUDGET_USD || "0"),
        collectionStats,
        raindropAccessToken: raindropUser?.raindropAccessToken,
      }
    }
  )

  // コレクション名をRaindrop APIから取得
  let collectionMap = new Map<number, string>()
  if (raindropAccessToken) {
    try {
      const collections = await getRaindropCollections(raindropAccessToken)
      collectionMap = createCollectionMap(collections)
    } catch {
      // コレクション名なしで続行
    }
  }

  const totalCost = Number(monthlyCost?.total || 0)
  const anthropicCost = Number(
    monthlyUsageByProvider.find((u) => u.provider === "anthropic")?.total || 0
  )
  const openaiCost = Number(
    monthlyUsageByProvider.find((u) => u.provider === "openai")?.total || 0
  )
  const budgetUsageRatio = budgetUsd > 0 ? totalCost / budgetUsd : 0
  const budgetUsagePercent = Math.min(100, Math.round(budgetUsageRatio * 100))
  const monthLabel = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  })

  return (
    <div className="space-y-8">
      <section className="border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="p-1 sm:p-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Overview
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              {user.name || "あなた"}さんの読書キューの今日の状態
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Raindrop.ioの蓄積、要約生成、APIコスト、未処理キューを一画面で確認できます。
              まずは取り込みを走らせて、新着記事の要約をまとめて進めましょう。
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ImportButton />
              <Button asChild variant="outline" className="h-10">
                <Link href="/summaries">
                  要約一覧へ
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="grid items-start gap-4">
          <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    保存済み記事
                  </p>
                  <p className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {raindropCount.count}
                  </p>
                  <Link
                    href="/raindrops"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    記事一覧を見る
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 dark:border-sky-900/70 dark:bg-sky-950/40">
                  <Newspaper className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    生成済み要約
                  </p>
                  <p className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {summaryCount.count}
                  </p>
                  <Link
                    href="/summaries"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    要約一覧を見る
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 dark:border-indigo-900/70 dark:bg-indigo-950/40">
                  <FileText className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="self-start overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader className="space-y-1 border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">今月のAPI利用</p>
            <div className="flex items-end justify-between gap-3">
              <p
                className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
                suppressHydrationWarning
              >
                ${totalCost.toFixed(4)}
              </p>
              <span className="text-xs text-slate-500">{monthLabel}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>月次予算</span>
                <span suppressHydrationWarning>
                  {budgetUsd > 0 ? `${budgetUsagePercent}% 使用` : "未設定"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-2 rounded-full transition-all ${
                    budgetUsd > 0 && budgetUsageRatio >= 1
                      ? "bg-rose-500"
                      : budgetUsd > 0 && budgetUsageRatio >= 0.8
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${budgetUsd > 0 ? budgetUsagePercent : 0}%` }}
                />
              </div>
              {budgetUsd > 0 && (
                <p className="text-xs text-slate-500" suppressHydrationWarning>
                  ${totalCost.toFixed(4)} / ${budgetUsd.toFixed(2)}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                <span className="text-slate-500">Claude</span>
                <span className="font-medium text-slate-900 dark:text-slate-100" suppressHydrationWarning>
                  ${anthropicCost.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                <span className="text-slate-500">OpenAI</span>
                <span className="font-medium text-slate-900 dark:text-slate-100" suppressHydrationWarning>
                  ${openaiCost.toFixed(4)}
                </span>
              </div>
            </div>

            {budgetUsd > 0 && budgetUsageRatio >= 0.8 && (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  budgetUsageRatio >= 1
                    ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200"
                }`}
              >
                月次予算アラート: 使用率が {budgetUsagePercent}% に達しています
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-6 xl:order-2">
          {recentSummaries.length > 0 && (
            <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    最近の要約
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    最新の生成結果をすばやく確認
                  </p>
                </div>
                <Link
                  href="/summaries"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  すべて見る
                </Link>
              </CardHeader>

              <CardContent className="px-5 pb-5 pt-0">
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                {recentSummaries.map((summary) => {
                  const toneInfo =
                    TONE_LABELS[summary.tone as keyof typeof TONE_LABELS] || {
                      label: summary.tone,
                      Icon: FileText,
                    }
                  const ToneIcon = toneInfo.Icon
                  const statusInfo =
                    STATUS_LABELS[summary.status as keyof typeof STATUS_LABELS] || STATUS_LABELS.pending
                  const StatusIcon = statusInfo.Icon

                  return (
                    <Link key={summary.id} href={`/summaries/${summary.id}`}>
                      <div className="border-b border-slate-200 bg-white p-4 transition-colors last:border-b-0 hover:bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/60 sm:p-5">
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5 hidden rounded-lg border border-slate-200 bg-white p-2 sm:block dark:border-slate-700 dark:bg-slate-900">
                            <ToneIcon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={summary.status === "failed" ? "destructive" : "secondary"}
                                className={statusInfo.className}
                              >
                                <StatusIcon
                                  className={`mr-1 h-3 w-3 ${
                                    summary.status === "processing" ? "animate-spin" : ""
                                  }`}
                                />
                                {statusInfo.label}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              >
                                <ToneIcon className="mr-1 h-3 w-3" />
                                {toneInfo.label}
                              </Badge>
                              <span className="text-xs text-slate-500" suppressHydrationWarning>
                                {new Date(summary.createdAt).toLocaleDateString("ja-JP", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  timeZone: "Asia/Tokyo",
                                })}
                              </span>
                            </div>

                            <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
                              {summary.articleTitle || "無題の記事"}
                            </h3>

                            {summary.status === "completed" && summary.summary ? (
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                                {summary.summary}
                              </p>
                            ) : (
                              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                要約結果を準備中です
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 xl:order-1">
          {collectionStats.length > 1 && (
            <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    コレクション別
                  </h2>
                  <p className="text-xs text-slate-500">記事数の多い順</p>
                </div>
                <Link href="/raindrops" className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                  記事一覧へ
                </Link>
              </CardHeader>
              <CardContent className="grid gap-2 px-5 pb-5 pt-0">
                {collectionStats.map((col) => {
                  const name = col.collectionId
                    ? collectionMap.get(col.collectionId) || `コレクション ${col.collectionId}`
                    : "未分類"
                  return (
                    <Link
                      key={col.collectionId ?? "null"}
                      href={
                        col.collectionId !== null
                          ? `/raindrops?collectionId=${col.collectionId}`
                          : "/raindrops"
                      }
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Folder className="h-4 w-4 flex-shrink-0 text-slate-500" />
                        <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {name}
                        </span>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {col.count}
                      </span>
                    </Link>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {nextToRead.length > 0 && (
            <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader className="space-y-1 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  次に読む候補
                </h2>
                <p className="text-xs text-slate-500">未要約の新着記事</p>
              </CardHeader>
              <CardContent className="space-y-2 px-5 pb-5 pt-0">
                {nextToRead.map((item, index) => (
                  <Link
                    key={item.id}
                    href={`/raindrops#raindrop-${item.id}`}
                    className="block rounded-lg border border-slate-200 px-3 py-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          優先度スコア: {Math.max(1, 100 - index * 10)}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-xs text-slate-500" suppressHydrationWarning>
                        {new Date(item.createdAtRemote).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}
