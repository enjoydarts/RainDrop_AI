import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { withRLS } from "@/db/rls"
import { summaries, raindrops } from "@/db/schema"
import { eq, desc, and, isNull, count } from "drizzle-orm"
import Link from "next/link"
import { FileText, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshButton } from "@/components/RefreshButton"
import { ClassifyThemesButton } from "@/components/ClassifyThemesButton"
import { RegenerateThemesButton } from "@/components/RegenerateThemesButton"
import { ExportButton } from "@/components/ExportButton"
import { SearchableList } from "./searchable-list"
import { SemanticSearch } from "@/components/SemanticSearch"

export default async function SummariesPage({
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

  // RLS対応: 生成済み要約を取得（記事情報と結合）
  const { items, totalCount } = await withRLS(userId, async (tx) => {
    const items = await tx
      .select({
        id: summaries.id,
        summary: summaries.summary,
        tone: summaries.tone,
        theme: summaries.theme,
        status: summaries.status,
        rating: summaries.rating,
        ratingReason: summaries.ratingReason,
        error: summaries.error,
        isPublic: summaries.isPublic,
        createdAt: summaries.createdAt,
        raindropId: summaries.raindropId,
        // 記事情報
        articleTitle: raindrops.title,
        articleCover: raindrops.cover,
        articleLink: raindrops.link,
        articleExcerpt: raindrops.excerpt,
        articleTags: raindrops.tags,
      })
      .from(summaries)
      .innerJoin(
        raindrops,
        and(eq(summaries.raindropId, raindrops.id), eq(summaries.userId, raindrops.userId))
      )
      .where(isNull(summaries.deletedAt))
      .orderBy(desc(summaries.updatedAt))
      .limit(pageSize)
      .offset(offset)

    const [total] = await tx
      .select({ count: count() })
      .from(summaries)
      .where(isNull(summaries.deletedAt))

    return { items, totalCount: total.count }
  })

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const prevPage = page > 1 ? page - 1 : null
  const nextPage = page < totalPages ? page + 1 : null

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8 sm:flex items-center sm:justify-between border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">要約一覧</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{totalCount}件の要約</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-wrap gap-2">
          <ExportButton />
          <ClassifyThemesButton />
          <RegenerateThemesButton />
          <RefreshButton />
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="px-4 py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">まだ要約が生成されていません</h3>
            <p className="text-sm text-slate-500 mb-4">記事を取り込んで、要約を生成してみましょう</p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link href="/raindrops">
                記事を取り込む
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* AI意味検索 */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">AI意味検索</h2>
            <SemanticSearch />
          </div>

          {/* 通常の検索とフィルター */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">すべての要約</h2>
            <SearchableList items={items} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {page} / {totalPages} ページ
            </p>
            <div className="flex items-center gap-2">
              {prevPage ? (
                <Link
                  href={`/summaries?page=${prevPage}`}
                  className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  前へ
                </Link>
              ) : null}
              {nextPage ? (
                <Link
                  href={`/summaries?page=${nextPage}`}
                  className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  次へ
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
