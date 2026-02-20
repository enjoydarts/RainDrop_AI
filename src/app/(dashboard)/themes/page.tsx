import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { withRLS } from "@/db/rls"
import { summaries } from "@/db/schema"
import { eq, and, isNotNull, count, max } from "drizzle-orm"
import Link from "next/link"
import { Tag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClassifyThemesButton } from "@/components/ClassifyThemesButton"
import { RegenerateThemesButton } from "@/components/RegenerateThemesButton"
import { ThemeManager } from "./theme-manager"

export default async function ThemesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id

  // テーマ別統計を取得
  const themeStats = await withRLS(userId, async (tx) => {
    return await tx
      .select({
        theme: summaries.theme,
        count: count(),
        lastUpdated: max(summaries.updatedAt),
      })
      .from(summaries)
      .where(
        and(
          eq(summaries.userId, userId),
          isNotNull(summaries.theme)
        )
      )
      .groupBy(summaries.theme)
      .orderBy(count())
  })

  // countの降順でソート
  const sorted = [...themeStats]
    .filter((t): t is { theme: string; count: number; lastUpdated: Date | null } =>
      t.theme !== null
    )
    .sort((a, b) => b.count - a.count)

  const totalThemes = sorted.length
  const totalClassified = sorted.reduce((sum, t) => sum + t.count, 0)

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8 sm:flex items-start sm:justify-between border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">テーマ管理</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {totalThemes}個のテーマ・{totalClassified}件の要約が分類済み
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <ClassifyThemesButton />
          <RegenerateThemesButton />
          <Button asChild variant="outline">
            <Link href="/summaries">
              要約一覧
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      {totalThemes > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/50 p-2">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">テーマ数</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalThemes}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/50 p-2">
                <Tag className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">分類済み要約</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalClassified}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-100 dark:bg-teal-900/50 p-2">
                <Tag className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">平均要約数/テーマ</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalThemes > 0 ? Math.round(totalClassified / totalThemes) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ThemeManager themes={sorted} />
    </div>
  )
}
