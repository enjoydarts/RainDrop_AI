import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { withRLS } from "@/db/rls"
import { summaryJobs, raindrops } from "@/db/schema"
import { and, count, desc, eq, isNull } from "drizzle-orm"
import { Card } from "@/components/ui/card"
import { Briefcase } from "lucide-react"
import { JobList } from "./job-list"
import { RefreshButton } from "@/components/RefreshButton"
import Link from "next/link"

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const params = await searchParams
  const page = Math.max(1, Number(params.page || "1"))
  const pageSize = 100
  const offset = (page - 1) * pageSize

  const { jobs, totalCount, statusCounts } = await withRLS(userId, async (tx) => {
    const jobs = await tx
      .select({
        jobId: summaryJobs.id,
        summaryId: summaryJobs.summaryId,
        raindropId: summaryJobs.raindropId,
        tone: summaryJobs.tone,
        status: summaryJobs.status,
        error: summaryJobs.error,
        updatedAt: summaryJobs.updatedAt,
        title: raindrops.title,
      })
      .from(summaryJobs)
      .innerJoin(
        raindrops,
        and(
          eq(summaryJobs.userId, raindrops.userId),
          eq(summaryJobs.raindropId, raindrops.id)
        )
      )
      .where(isNull(summaryJobs.deletedAt))
      .orderBy(desc(summaryJobs.updatedAt))
      .limit(pageSize)
      .offset(offset)

    const [total] = await tx
      .select({ count: count() })
      .from(summaryJobs)
      .where(isNull(summaryJobs.deletedAt))

    const grouped = await tx
      .select({
        status: summaryJobs.status,
        count: count(),
      })
      .from(summaryJobs)
      .where(isNull(summaryJobs.deletedAt))
      .groupBy(summaryJobs.status)

    const statusCounts = grouped.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item.count
      return acc
    }, {})

    return {
      jobs,
      totalCount: total.count,
      statusCounts,
    }
  })

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const prevPage = page > 1 ? page - 1 : null
  const nextPage = page < totalPages ? page + 1 : null

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
              <Briefcase className="h-7 w-7 text-indigo-600" />
              ジョブ管理
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              要約ジョブの状態確認・失敗ジョブの再実行ができます
            </p>
            <p className="mt-1 text-xs text-slate-500">
              保持期間: 完了90日 / 失敗180日（毎日自動クリーンアップ）
            </p>
          </div>
          <RefreshButton />
        </div>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-slate-500">ジョブがまだありません</p>
          </div>
        </Card>
      ) : (
        <>
          <JobList jobs={jobs} statusCounts={statusCounts} />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {page} / {totalPages} ページ（全 {totalCount} 件）
            </p>
            <div className="flex items-center gap-2">
              {prevPage ? (
                <Link
                  href={`/jobs?page=${prevPage}`}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  前へ
                </Link>
              ) : null}
              {nextPage ? (
                <Link
                  href={`/jobs?page=${nextPage}`}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  次へ
                </Link>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
