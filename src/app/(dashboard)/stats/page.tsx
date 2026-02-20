import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { withRLS } from "@/db/rls"
import { raindrops, summaries, apiUsage, users } from "@/db/schema"
import { eq, and, sql, desc, gte, lt, isNull } from "drizzle-orm"
import { ClipboardList, Zap, Flame, MessageCircle, TrendingUp, TrendingDown } from "lucide-react"
import { BudgetSettings } from "@/components/BudgetSettings"

const TONE_LABELS = {
  neutral: { label: "客観的", Icon: ClipboardList, color: "bg-slate-100 text-slate-700" },
  snarky: { label: "毒舌", Icon: Zap, color: "bg-purple-100 text-purple-700" },
  enthusiastic: { label: "熱量高め", Icon: Flame, color: "bg-red-100 text-red-700" },
  casual: { label: "カジュアル", Icon: MessageCircle, color: "bg-blue-100 text-blue-700" },
} as const

type ToneKey = keyof typeof TONE_LABELS
type ToneFilter = ToneKey | "all"

type SearchParamsInput =
  | { tone?: string | string[] }
  | Promise<{ tone?: string | string[] }>

function toDayKeyJst(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function toDayLabelJst(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function buildRecentDayBuckets(days: number): Array<{ key: string; label: string }> {
  const buckets: Array<{ key: string; label: string }> = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))

  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    buckets.push({
      key: toDayKeyJst(d),
      label: toDayLabelJst(d),
    })
  }

  return buckets
}

function calculateDelta(current: number, previous: number): { text: string; positive: boolean } | null {
  if (previous === 0) {
    if (current === 0) return null
    return { text: "+100%", positive: true }
  }

  const change = ((current - previous) / previous) * 100
  const rounded = Math.abs(change).toFixed(1)
  return {
    text: `${change >= 0 ? "+" : "-"}${rounded}%`,
    positive: change >= 0,
  }
}

function TrendDelta({ value }: { value: { text: string; positive: boolean } | null }) {
  if (!value) {
    return <span className="text-xs text-slate-500">前期間比較なし</span>
  }

  const Icon = value.positive ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        value.positive ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {value.text}
    </span>
  )
}

function MiniBarChart({
  data,
  colorClass,
  emptyLabel,
}: {
  data: Array<{ label: string; value: number }>
  colorClass: string
  emptyLabel: string
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 0)

  if (maxValue === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div>
      <div className="flex h-36 items-end gap-1 rounded-lg bg-slate-50 p-2">
        {data.map((item) => {
          const height = Math.max((item.value / maxValue) * 100, item.value > 0 ? 4 : 0)
          return (
            <div key={item.label} className="group relative flex-1">
              <div className={`w-full rounded-sm ${colorClass}`} style={{ height: `${height}%` }} />
              <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[10px] text-white group-hover:block">
                {item.value.toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {}
  const toneParam = Array.isArray(resolvedSearchParams.tone)
    ? resolvedSearchParams.tone[0]
    : resolvedSearchParams.tone
  const selectedTone: ToneFilter =
    toneParam && toneParam in TONE_LABELS ? (toneParam as ToneKey) : "all"

  const userId = session.user.id

  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)
  thisMonthStart.setHours(0, 0, 0, 0)

  const trendWindowDays = 30
  const trendStart = new Date()
  trendStart.setHours(0, 0, 0, 0)
  trendStart.setDate(trendStart.getDate() - (trendWindowDays - 1))

  const previousTrendStart = new Date(trendStart)
  previousTrendStart.setDate(previousTrendStart.getDate() - trendWindowDays)

  const lowRatingWindowStart = new Date()
  lowRatingWindowStart.setHours(0, 0, 0, 0)
  lowRatingWindowStart.setDate(lowRatingWindowStart.getDate() - 7)

  const dayBuckets = buildRecentDayBuckets(trendWindowDays)

  const {
    stats,
    monthlyUsage,
    monthlyUsageByProvider,
    summariesByTone,
    ratingDistribution,
    recentSummaries,
    lowRatedSummaries,
    dailySummaryRows,
    dailyUsageRows,
    currentTrend,
    previousTrend,
    monthlyBudgetUsd,
  } = await withRLS(userId, async (tx) => {
    const [stats] = await tx
      .select({
        totalRaindrops: sql<number>`count(distinct ${raindrops.id})`.mapWith(Number),
        totalSummaries: sql<number>`count(distinct ${summaries.id})`.mapWith(Number),
      })
      .from(raindrops)
      .leftJoin(summaries, eq(raindrops.id, summaries.raindropId))
      .where(isNull(raindrops.deletedAt))

    const monthlyUsage = await tx
      .select({
        totalCost: sql<string>`COALESCE(SUM(${apiUsage.costUsd}), 0)`,
        totalInputTokens: sql<number>`COALESCE(SUM(${apiUsage.inputTokens}), 0)`.mapWith(Number),
        totalOutputTokens: sql<number>`COALESCE(SUM(${apiUsage.outputTokens}), 0)`.mapWith(Number),
      })
      .from(apiUsage)
      .where(gte(apiUsage.createdAt, thisMonthStart))

    const monthlyUsageByProvider = await tx
      .select({
        provider: apiUsage.apiProvider,
        cost: sql<string>`COALESCE(SUM(${apiUsage.costUsd}), 0)`,
        inputTokens: sql<number>`COALESCE(SUM(${apiUsage.inputTokens}), 0)`.mapWith(Number),
        outputTokens: sql<number>`COALESCE(SUM(${apiUsage.outputTokens}), 0)`.mapWith(Number),
      })
      .from(apiUsage)
      .where(gte(apiUsage.createdAt, thisMonthStart))
      .groupBy(apiUsage.apiProvider)

    const summariesByTone = await tx
      .select({
        tone: summaries.tone,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(summaries)
      .where(and(eq(summaries.status, "completed"), isNull(summaries.deletedAt)))
      .groupBy(summaries.tone)

    const ratingDistribution = await tx
      .select({
        rating: summaries.rating,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(summaries)
      .where(
        and(
          eq(summaries.status, "completed"),
          sql`${summaries.rating} IS NOT NULL`,
          isNull(summaries.deletedAt)
        )
      )
      .groupBy(summaries.rating)
      .orderBy(summaries.rating)

    const recentSummaries = await tx
      .select({
        id: summaries.id,
        tone: summaries.tone,
        status: summaries.status,
        rating: summaries.rating,
        createdAt: summaries.createdAt,
        articleTitle: raindrops.title,
      })
      .from(summaries)
      .innerJoin(
        raindrops,
        and(eq(summaries.raindropId, raindrops.id), eq(summaries.userId, raindrops.userId))
      )
      .where(isNull(summaries.deletedAt))
      .orderBy(desc(summaries.updatedAt))
      .limit(5)

    const lowRatedSummaries = await tx
      .select({
        id: summaries.id,
        tone: summaries.tone,
        rating: summaries.rating,
        userFeedback: summaries.userFeedback,
        updatedAt: summaries.updatedAt,
        articleTitle: raindrops.title,
      })
      .from(summaries)
      .innerJoin(
        raindrops,
        and(eq(summaries.raindropId, raindrops.id), eq(summaries.userId, raindrops.userId))
      )
      .where(
        and(
          eq(summaries.status, "completed"),
          isNull(summaries.deletedAt),
          gte(summaries.updatedAt, lowRatingWindowStart),
          sql`${summaries.rating} <= 2`
        )
      )
      .orderBy(desc(summaries.updatedAt))
      .limit(5)

    const summaryDayExpr = sql<string>`to_char(date_trunc('day', ${summaries.updatedAt} AT TIME ZONE 'Asia/Tokyo'), 'YYYY-MM-DD')`
    const usageDayExpr = sql<string>`to_char(date_trunc('day', ${apiUsage.createdAt} AT TIME ZONE 'Asia/Tokyo'), 'YYYY-MM-DD')`

    const dailySummaryRows = await tx
      .select({
        day: summaryDayExpr,
        tone: summaries.tone,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(summaries)
      .where(
        and(
          eq(summaries.status, "completed"),
          isNull(summaries.deletedAt),
          gte(summaries.updatedAt, trendStart),
          selectedTone === "all" ? undefined : eq(summaries.tone, selectedTone)
        )
      )
      .groupBy(summaryDayExpr, summaries.tone)
      .orderBy(summaryDayExpr)

    const dailyUsageRows =
      selectedTone === "all"
        ? await tx
            .select({
              day: usageDayExpr,
              cost: sql<string>`COALESCE(SUM(${apiUsage.costUsd}), 0)`,
              inputTokens: sql<number>`COALESCE(SUM(${apiUsage.inputTokens}), 0)`.mapWith(Number),
              outputTokens: sql<number>`COALESCE(SUM(${apiUsage.outputTokens}), 0)`.mapWith(Number),
            })
            .from(apiUsage)
            .where(gte(apiUsage.createdAt, trendStart))
            .groupBy(usageDayExpr)
            .orderBy(usageDayExpr)
        : await tx
            .select({
              day: usageDayExpr,
              cost: sql<string>`COALESCE(SUM(${apiUsage.costUsd}), 0)`,
              inputTokens: sql<number>`COALESCE(SUM(${apiUsage.inputTokens}), 0)`.mapWith(Number),
              outputTokens: sql<number>`COALESCE(SUM(${apiUsage.outputTokens}), 0)`.mapWith(Number),
            })
            .from(apiUsage)
            .innerJoin(
              summaries,
              and(eq(apiUsage.summaryId, summaries.id), eq(apiUsage.userId, summaries.userId))
            )
            .where(
              and(
                gte(apiUsage.createdAt, trendStart),
                eq(summaries.tone, selectedTone),
                isNull(summaries.deletedAt)
              )
            )
            .groupBy(usageDayExpr)
            .orderBy(usageDayExpr)

    const [currentTrend] = await tx
      .select({
        summaryCount: sql<number>`COALESCE(COUNT(CASE WHEN ${summaries.status} = 'completed' THEN 1 END), 0)`.mapWith(
          Number
        ),
        avgRating:
          sql<number>`COALESCE(AVG(CASE WHEN ${summaries.status} = 'completed' AND ${summaries.rating} IS NOT NULL THEN ${summaries.rating} END), 0)`.mapWith(
            Number
          ),
      })
      .from(summaries)
      .where(
        and(
          isNull(summaries.deletedAt),
          gte(summaries.updatedAt, trendStart),
          selectedTone === "all" ? undefined : eq(summaries.tone, selectedTone)
        )
      )

    const [previousTrend] = await tx
      .select({
        summaryCount: sql<number>`COALESCE(COUNT(CASE WHEN ${summaries.status} = 'completed' THEN 1 END), 0)`.mapWith(
          Number
        ),
        avgRating:
          sql<number>`COALESCE(AVG(CASE WHEN ${summaries.status} = 'completed' AND ${summaries.rating} IS NOT NULL THEN ${summaries.rating} END), 0)`.mapWith(
            Number
          ),
      })
      .from(summaries)
      .where(
        and(
          isNull(summaries.deletedAt),
          gte(summaries.updatedAt, previousTrendStart),
          lt(summaries.updatedAt, trendStart),
          selectedTone === "all" ? undefined : eq(summaries.tone, selectedTone)
        )
      )

    const [currentCost] =
      selectedTone === "all"
        ? await tx
            .select({
              cost: sql<string>`COALESCE(SUM(${apiUsage.costUsd}), 0)`,
              tokens:
                sql<number>`COALESCE(SUM(${apiUsage.inputTokens}) + SUM(${apiUsage.outputTokens}), 0)`.mapWith(
                  Number
                ),
            })
            .from(apiUsage)
            .where(gte(apiUsage.createdAt, trendStart))
        : await tx
            .select({
              cost: sql<string>`COALESCE(SUM(${apiUsage.costUsd}), 0)`,
              tokens:
                sql<number>`COALESCE(SUM(${apiUsage.inputTokens}) + SUM(${apiUsage.outputTokens}), 0)`.mapWith(
                  Number
                ),
            })
            .from(apiUsage)
            .innerJoin(
              summaries,
              and(eq(apiUsage.summaryId, summaries.id), eq(apiUsage.userId, summaries.userId))
            )
            .where(
              and(
                gte(apiUsage.createdAt, trendStart),
                eq(summaries.tone, selectedTone),
                isNull(summaries.deletedAt)
              )
            )

    const [previousCost] =
      selectedTone === "all"
        ? await tx
            .select({
              cost: sql<string>`COALESCE(SUM(${apiUsage.costUsd}), 0)`,
              tokens:
                sql<number>`COALESCE(SUM(${apiUsage.inputTokens}) + SUM(${apiUsage.outputTokens}), 0)`.mapWith(
                  Number
                ),
            })
            .from(apiUsage)
            .where(and(gte(apiUsage.createdAt, previousTrendStart), lt(apiUsage.createdAt, trendStart)))
        : await tx
            .select({
              cost: sql<string>`COALESCE(SUM(${apiUsage.costUsd}), 0)`,
              tokens:
                sql<number>`COALESCE(SUM(${apiUsage.inputTokens}) + SUM(${apiUsage.outputTokens}), 0)`.mapWith(
                  Number
                ),
            })
            .from(apiUsage)
            .innerJoin(
              summaries,
              and(eq(apiUsage.summaryId, summaries.id), eq(apiUsage.userId, summaries.userId))
            )
            .where(
              and(
                gte(apiUsage.createdAt, previousTrendStart),
                lt(apiUsage.createdAt, trendStart),
                eq(summaries.tone, selectedTone),
                isNull(summaries.deletedAt)
              )
            )

    const [userBudget] = await tx
      .select({ monthlyBudgetUsd: users.monthlyBudgetUsd })
      .from(users)
      .limit(1)

    return {
      stats,
      monthlyUsage,
      monthlyUsageByProvider,
      summariesByTone,
      ratingDistribution,
      recentSummaries,
      lowRatedSummaries,
      dailySummaryRows,
      dailyUsageRows,
      currentTrend: {
        summaryCount: currentTrend?.summaryCount ?? 0,
        avgRating: currentTrend?.avgRating ?? 0,
        cost: Number(currentCost?.cost ?? "0"),
        tokens: currentCost?.tokens ?? 0,
      },
      previousTrend: {
        summaryCount: previousTrend?.summaryCount ?? 0,
        avgRating: previousTrend?.avgRating ?? 0,
        cost: Number(previousCost?.cost ?? "0"),
        tokens: previousCost?.tokens ?? 0,
      },
      monthlyBudgetUsd: userBudget?.monthlyBudgetUsd
        ? Number(userBudget.monthlyBudgetUsd)
        : Number(process.env.DEFAULT_MONTHLY_BUDGET_USD || "0"),
    }
  })

  const totalCost = parseFloat(monthlyUsage[0]?.totalCost || "0")

  const anthropicUsage = monthlyUsageByProvider.find((u) => u.provider === "anthropic")
  const openaiUsage = monthlyUsageByProvider.find((u) => u.provider === "openai")

  const anthropicCost = parseFloat(anthropicUsage?.cost || "0")
  const openaiCost = parseFloat(openaiUsage?.cost || "0")

  const summaryCountByDay = new Map<string, number>()
  for (const row of dailySummaryRows) {
    const prev = summaryCountByDay.get(row.day) ?? 0
    summaryCountByDay.set(row.day, prev + row.count)
  }

  const usageByDay = new Map<string, { cost: number; tokens: number }>()
  for (const row of dailyUsageRows) {
    usageByDay.set(row.day, {
      cost: Number(row.cost ?? "0"),
      tokens: (row.inputTokens ?? 0) + (row.outputTokens ?? 0),
    })
  }

  const summarySeries = dayBuckets.map((bucket) => ({
    label: bucket.label,
    value: summaryCountByDay.get(bucket.key) ?? 0,
  }))
  const costSeries = dayBuckets.map((bucket) => ({
    label: bucket.label,
    value: Number((usageByDay.get(bucket.key)?.cost ?? 0).toFixed(4)),
  }))
  const tokenSeries = dayBuckets.map((bucket) => ({
    label: bucket.label,
    value: usageByDay.get(bucket.key)?.tokens ?? 0,
  }))

  const daysInMonth = new Date().getDate()
  const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const forecastMonthlyCost = daysInMonth > 0 ? (totalCost / daysInMonth) * totalDaysInMonth : totalCost
  const budgetProgressPct = monthlyBudgetUsd > 0 ? Math.min((totalCost / monthlyBudgetUsd) * 100, 100) : 0
  const forecastProgressPct =
    monthlyBudgetUsd > 0 ? Math.min((forecastMonthlyCost / monthlyBudgetUsd) * 100, 999) : 0

  const summaryDelta = calculateDelta(currentTrend.summaryCount, previousTrend.summaryCount)
  const costDelta = calculateDelta(currentTrend.cost, previousTrend.cost)
  const tokenDelta = calculateDelta(currentTrend.tokens, previousTrend.tokens)
  const ratingDelta = calculateDelta(currentTrend.avgRating, previousTrend.avgRating)

  const toneFilters: Array<{ value: ToneFilter; label: string }> = [
    { value: "all", label: "全体" },
    { value: "neutral", label: TONE_LABELS.neutral.label },
    { value: "snarky", label: TONE_LABELS.snarky.label },
    { value: "enthusiastic", label: TONE_LABELS.enthusiastic.label },
    { value: "casual", label: TONE_LABELS.casual.label },
  ]

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">統計</h1>
        <p className="mt-2 text-sm text-slate-600">記事と要約の統計情報</p>
      </div>

      <div className="mb-8">
        <BudgetSettings initialBudgetUsd={monthlyBudgetUsd} />
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">予算進捗と月末予測</h2>
          <span className="text-xs text-slate-500">JST基準</span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">現在の使用額</span>
            <span className="font-semibold text-slate-900">${totalCost.toFixed(4)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                budgetProgressPct >= 100
                  ? "bg-rose-500"
                  : budgetProgressPct >= 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${budgetProgressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>予算: ${monthlyBudgetUsd.toFixed(2)}</span>
            <span>{budgetProgressPct.toFixed(1)}%</span>
          </div>

          <div className="pt-2 text-sm">
            <span className="text-slate-600">月末予測: </span>
            <span
              className={`font-semibold ${
                forecastProgressPct >= 100
                  ? "text-rose-600"
                  : forecastProgressPct >= 80
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            >
              ${forecastMonthlyCost.toFixed(4)}
            </span>
            <span className="ml-2 text-xs text-slate-500">({forecastProgressPct.toFixed(1)}% of budget)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">総記事数</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalRaindrops}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">総要約数</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalSummaries}</p>
          <div className="mt-2">
            <TrendDelta value={summaryDelta} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">今月のコスト</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">${totalCost.toFixed(4)}</p>
          <div className="mt-2 space-y-0.5">
            {anthropicCost > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Claude:</span>
                <span className="font-medium text-slate-700">${anthropicCost.toFixed(4)}</span>
              </div>
            )}
            {openaiCost > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">OpenAI:</span>
                <span className="font-medium text-slate-700">${openaiCost.toFixed(4)}</span>
              </div>
            )}
          </div>
          <div className="mt-2">
            <TrendDelta value={costDelta} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">30日平均評価</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{currentTrend.avgRating.toFixed(2)}</p>
          <div className="mt-2">
            <TrendDelta value={ratingDelta} />
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">30日推移</h2>
            <p className="text-sm text-slate-500">要約数・コスト・トークンの時系列</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {toneFilters.map((filter) => (
              <Link
                key={filter.value}
                href={filter.value === "all" ? "/stats" : `/stats?tone=${filter.value}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTone === filter.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">要約数 / 日</h3>
              <TrendDelta value={summaryDelta} />
            </div>
            <MiniBarChart data={summarySeries} colorClass="bg-indigo-500" emptyLabel="要約データがありません" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">コスト / 日 (USD)</h3>
              <TrendDelta value={costDelta} />
            </div>
            <MiniBarChart data={costSeries} colorClass="bg-emerald-500" emptyLabel="コストデータがありません" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">トークン / 日</h3>
              <TrendDelta value={tokenDelta} />
            </div>
            <MiniBarChart data={tokenSeries} colorClass="bg-amber-500" emptyLabel="トークンデータがありません" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">トーン別要約数</h2>
          <div className="space-y-3">
            {summariesByTone.map((item) => {
              const toneInfo = TONE_LABELS[item.tone as ToneKey] || {
                label: item.tone,
                Icon: ClipboardList,
                color: "bg-slate-100 text-slate-700",
              }
              const ToneIcon = toneInfo.Icon
              const percentage = stats.totalSummaries > 0 ? (item.count / stats.totalSummaries) * 100 : 0

              return (
                <div key={item.tone} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${toneInfo.color}`}
                    >
                      <ToneIcon className="h-3 w-3" />
                      {toneInfo.label}
                    </span>
                    <span className="text-sm text-slate-600">{item.count}件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-12 text-right text-sm font-medium text-slate-900">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">評価分布</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const data = ratingDistribution.find((r) => r.rating === rating)
              const count = data?.count || 0
              const total = ratingDistribution.reduce((sum, r) => sum + r.count, 0)
              const percentage = total > 0 ? (count / total) * 100 : 0

              return (
                <div key={rating} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-yellow-400">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
                    <span className="text-sm text-slate-600">{count}件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-yellow-400" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-12 text-right text-sm font-medium text-slate-900">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">最近の要約</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentSummaries.map((item) => {
              const toneInfo = TONE_LABELS[item.tone as ToneKey] || {
                label: item.tone,
                Icon: ClipboardList,
                color: "bg-slate-100 text-slate-700",
              }
              const ToneIcon = toneInfo.Icon

              return (
                <div key={item.id} className="px-6 py-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-sm font-medium text-slate-900">{item.articleTitle}</h3>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <ToneIcon className="h-3 w-3" />
                          {toneInfo.label}
                        </span>
                        {item.status === "completed" && (
                          <span className="inline-flex items-center gap-1 text-green-600">完了</span>
                        )}
                        {item.rating && <span className="text-yellow-400">{"★".repeat(item.rating)}</span>}
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">直近7日の低評価要約</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {lowRatedSummaries.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                直近7日で低評価（★1〜2）の要約はありません
              </div>
            )}
            {lowRatedSummaries.map((item) => {
              const toneInfo = TONE_LABELS[item.tone as ToneKey] || {
                label: item.tone,
                Icon: ClipboardList,
                color: "bg-slate-100 text-slate-700",
              }
              const ToneIcon = toneInfo.Icon

              return (
                <div key={item.id} className="px-6 py-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-sm font-medium text-slate-900">{item.articleTitle}</h3>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <ToneIcon className="h-3 w-3" />
                          {toneInfo.label}
                        </span>
                        <span className="text-rose-600">{"★".repeat(item.rating || 0)}</span>
                      </div>
                      {item.userFeedback && (
                        <p className="mt-2 line-clamp-2 text-xs text-slate-600">{item.userFeedback}</p>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      {new Date(item.updatedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
