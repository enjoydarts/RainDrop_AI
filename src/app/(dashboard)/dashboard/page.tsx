import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { raindrops, summaries, apiUsage } from "@/db/schema"
import { eq, count, sum, isNull, and, gte, sql } from "drizzle-orm"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()

  console.log("[dashboard] Session from auth():", JSON.stringify(session, null, 2))

  // ミドルウェアで既に認証済みなので、ここでは必ず session.user が存在する
  const user = session!.user
  const userId = user.id!

  // 統計情報を取得
  const [raindropCount] = await db
    .select({ count: count() })
    .from(raindrops)
    .where(and(eq(raindrops.userId, userId), isNull(raindrops.deletedAt)))

  const [summaryCount] = await db
    .select({ count: count() })
    .from(summaries)
    .where(eq(summaries.userId, userId))

  // 今月のAPI使用量
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [monthlyCost] = await db
    .select({ total: sum(apiUsage.costUsd) })
    .from(apiUsage)
    .where(and(
      eq(apiUsage.userId, userId),
      gte(apiUsage.createdAt, firstDayOfMonth)
    ))

  const totalCost = Number(monthlyCost?.total || 0)

  // 最近の要約を取得
  const recentSummaries = await db
    .select({
      id: summaries.id,
      raindropId: summaries.raindropId,
      tone: summaries.tone,
      status: summaries.status,
      createdAt: summaries.createdAt,
    })
    .from(summaries)
    .where(eq(summaries.userId, userId))
    .orderBy(sql`${summaries.createdAt} DESC`)
    .limit(3)

  return (
    <div className="space-y-8">
      {/* ウェルカムセクション */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          ようこそ、{user.name}さん
        </h1>
        <p className="mt-3 text-base text-gray-600">
          Raindrop.ioから記事を取り込んで、AI要約を生成しましょう
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 記事数 */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 mb-2">保存済み記事</dt>
                <dd className="text-4xl font-bold text-gray-900">{raindropCount.count}</dd>
              </div>
              <div className="flex-shrink-0 rounded-lg bg-indigo-50 p-3">
                <svg className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3">
            <Link href="/raindrops" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
              記事一覧を見る
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* 要約数 */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 mb-2">生成済み要約</dt>
                <dd className="text-4xl font-bold text-gray-900">{summaryCount.count}</dd>
              </div>
              <div className="flex-shrink-0 rounded-lg bg-green-50 p-3">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3">
            <Link href="/summaries" className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-1 group">
              要約一覧を見る
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* 今月のコスト */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 mb-2">今月のAPI利用</dt>
                <dd className="text-4xl font-bold text-gray-900" suppressHydrationWarning>
                  ${totalCost.toFixed(4)}
                </dd>
              </div>
              <div className="flex-shrink-0 rounded-lg bg-purple-50 p-3">
                <svg className="h-7 w-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3">
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-8 shadow-sm">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-indigo-900">記事を取り込む</h2>
            <p className="mt-2 text-base text-indigo-700">
              Raindrop.ioから最新の記事を同期して、AI要約を生成しましょう
            </p>
          </div>
          <div className="mt-6 sm:mt-0 sm:ml-6 flex-shrink-0">
            <Link
              href="/raindrops"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-indigo-600 bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 hover:border-indigo-700 transition-colors"
            >
              記事を同期
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* 最近の要約 */}
      {recentSummaries.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">最近の要約</h2>
            <Link href="/summaries" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              すべて見る →
            </Link>
          </div>
          <div className="space-y-4">
            {recentSummaries.map((summary) => (
              <Link
                key={summary.id}
                href={`/summaries/${summary.id}`}
                className="block rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium capitalize text-indigo-800">
                      {summary.tone}
                    </span>
                    <span className="text-sm text-gray-500" suppressHydrationWarning>
                      {new Date(summary.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      summary.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : summary.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {summary.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
