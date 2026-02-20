import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { withRLS } from "@/db/rls"
import { raindrops, summaries, apiUsage, users } from "@/db/schema"
import { count, sum, isNull, and, gte, sql, desc } from "drizzle-orm"
import Link from "next/link"
import { Newspaper, FileText, DollarSign, ChevronRight, ArrowRight, ClipboardList, Zap, Flame, MessageCircle, Check, X, Loader2, Clock, Folder } from "lucide-react"
import { getRaindropCollections, createCollectionMap } from "@/lib/raindrop-api"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { maskSession } from "@/lib/logger"

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

  // プロバイダー別コストを計算
  const anthropicCost = Number(
    monthlyUsageByProvider.find((u) => u.provider === "anthropic")?.total || 0
  )
  const openaiCost = Number(
    monthlyUsageByProvider.find((u) => u.provider === "openai")?.total || 0
  )
  const budgetUsageRatio = budgetUsd > 0 ? totalCost / budgetUsd : 0
  const processingCount = statusCounts.find((s) => s.status === "processing")?.count || 0
  const pendingCount = statusCounts.find((s) => s.status === "pending")?.count || 0
  const failedCount = statusCounts.find((s) => s.status === "failed")?.count || 0

  return (
    <div className="space-y-8">
      {/* ウェルカムセクション */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          ようこそ、{user.name}さん
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
          Raindrop.ioから記事を取り込んで、AI要約を生成しましょう
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 記事数 */}
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <dt className="text-sm font-medium text-slate-500 mb-2">保存済み記事</dt>
                <dd className="text-4xl font-bold text-slate-900 dark:text-slate-100">{raindropCount.count}</dd>
              </div>
              <div className="flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
                <Newspaper className="h-7 w-7 text-indigo-600" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3">
            <Link href="/raindrops" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
              記事一覧を見る
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </CardFooter>
        </Card>

        {/* 要約数 */}
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <dt className="text-sm font-medium text-slate-500 mb-2">生成済み要約</dt>
                <dd className="text-4xl font-bold text-slate-900 dark:text-slate-100">{summaryCount.count}</dd>
              </div>
              <div className="flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
                <FileText className="h-7 w-7 text-indigo-600" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3">
            <Link href="/summaries" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
              要約一覧を見る
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </CardFooter>
        </Card>

        {/* 今月のコスト */}
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <dt className="text-sm font-medium text-slate-500 mb-2">今月のAPI利用</dt>
                <dd className="text-4xl font-bold text-slate-900 dark:text-slate-100" suppressHydrationWarning>
                  ${totalCost.toFixed(4)}
                </dd>
                {/* プロバイダー別内訳 */}
                <div className="mt-3 space-y-1">
                  {anthropicCost > 0 && (
                    <div className="flex items-center justify-between text-xs" suppressHydrationWarning>
                      <span className="text-slate-500">Claude:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">${anthropicCost.toFixed(4)}</span>
                    </div>
                  )}
                  {openaiCost > 0 && (
                    <div className="flex items-center justify-between text-xs" suppressHydrationWarning>
                      <span className="text-slate-500">OpenAI:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">${openaiCost.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
                <DollarSign className="h-7 w-7 text-indigo-600" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
            </span>
          </CardFooter>
        </Card>
      </div>

      {/* クイックアクション */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 shadow-sm">
        <CardContent className="p-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">記事を取り込む</h2>
              <p className="mt-2 text-base text-indigo-700 dark:text-indigo-300">
                Raindrop.ioから最新の記事を同期して、AI要約を生成しましょう
              </p>
            </div>
            <div className="mt-6 sm:mt-0 sm:ml-6 flex-shrink-0">
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                <Link href="/raindrops">
                  記事を同期
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {budgetUsd > 0 && budgetUsageRatio >= 0.8 && (
        <Card className={`border-2 ${budgetUsageRatio >= 1 ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50" : "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50"} shadow-sm`}>
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">月次予算アラート</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              ${totalCost.toFixed(4)} / ${budgetUsd.toFixed(2)} 使用中
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">処理キュー状況</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-md bg-white dark:bg-slate-800 px-3 py-2">
              <p className="text-slate-500">処理中</p>
              <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{processingCount}</p>
            </div>
            <div className="rounded-md bg-white dark:bg-slate-800 px-3 py-2">
              <p className="text-slate-500">待機中</p>
              <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{pendingCount}</p>
            </div>
            <div className="rounded-md bg-white dark:bg-slate-800 px-3 py-2">
              <p className="text-slate-500">失敗</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">{failedCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 最近の要約 */}
      {recentSummaries.length > 0 && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">最近の要約</h2>
            <Link href="/summaries" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              すべて見る →
            </Link>
          </div>
          <div className="grid gap-4">
            {recentSummaries.map((summary) => {
              const toneInfo = TONE_LABELS[summary.tone as keyof typeof TONE_LABELS] || {
                label: summary.tone,
                Icon: FileText
              }
              const ToneIcon = toneInfo.Icon

              return (
                <Link key={summary.id} href={`/summaries/${summary.id}`}>
                  <Card className="card-hover">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* ヘッダー: タイトルとステータス */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="flex-1 text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                            {summary.articleTitle || '無題の記事'}
                          </h3>
                          {(() => {
                            const statusInfo = STATUS_LABELS[summary.status as keyof typeof STATUS_LABELS] || STATUS_LABELS.pending
                            const StatusIcon = statusInfo.Icon
                            return (
                              <Badge
                                variant={summary.status === 'failed' ? 'destructive' : 'secondary'}
                                className={statusInfo.className}
                              >
                                <StatusIcon className={`h-3 w-3 mr-1 ${summary.status === 'processing' ? 'animate-spin' : ''}`} />
                                {statusInfo.label}
                              </Badge>
                            )
                          })()}
                        </div>

                        {/* 要約プレビュー */}
                        {summary.status === 'completed' && summary.summary && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {summary.summary.substring(0, 150)}...
                          </p>
                        )}

                        {/* メタ情報 */}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
                            <ToneIcon className="h-3 w-3 mr-1" />
                            {toneInfo.label}
                          </Badge>
                          <span suppressHydrationWarning>
                            {new Date(summary.createdAt).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              timeZone: 'Asia/Tokyo'
                            })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* コレクション別記事数 */}
      {collectionStats.length > 1 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">コレクション別</h2>
            <Link href="/raindrops" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              記事一覧へ →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {collectionStats.map((col) => {
              const name = col.collectionId
                ? (collectionMap.get(col.collectionId) || `コレクション ${col.collectionId}`)
                : "未分類"
              return (
                <Link
                  key={col.collectionId ?? "null"}
                  href="/raindrops"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Folder className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{name}</p>
                    <p className="text-xs text-slate-500">{col.count}件</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {nextToRead.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">次に読む候補</h2>
            <p className="text-sm text-slate-500">未要約の記事を優先度順に表示しています</p>
          </div>
          <div className="space-y-2">
            {nextToRead.map((item, index) => (
              <Link
                key={item.id}
                href="/raindrops"
                className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    優先度スコア: {Math.max(1, 100 - index * 10)}
                  </p>
                </div>
                <span className="text-xs text-slate-500" suppressHydrationWarning>
                  {new Date(item.createdAtRemote).toLocaleDateString("ja-JP")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
