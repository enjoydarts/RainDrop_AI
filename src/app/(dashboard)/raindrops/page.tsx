import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { withRLS } from "@/db/rls"
import { raindrops, users } from "@/db/schema"
import { desc, isNull, count } from "drizzle-orm"
import { Newspaper } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ImportButton } from "./import-button"
import { SearchableList } from "./searchable-list"
import { RefreshButton } from "@/components/RefreshButton"
import { getRaindropCollections, createCollectionMap } from "@/lib/raindrop-api"
import Link from "next/link"

export default async function RaindropsPage({
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
  const pageSize = 50
  const offset = (page - 1) * pageSize

  // RLS対応: セッション変数を設定してクエリを実行
  const { items, user, totalCount } = await withRLS(userId, async (tx) => {
    // 取り込み済み記事を取得（RLSで自動的にユーザーのデータのみ取得）
    const items = await tx
      .select()
      .from(raindrops)
      .where(isNull(raindrops.deletedAt))
      .orderBy(desc(raindrops.createdAtRemote))
      .limit(pageSize)
      .offset(offset)

    const [total] = await tx
      .select({ count: count() })
      .from(raindrops)
      .where(isNull(raindrops.deletedAt))

    // ユーザーのRaindropアクセストークンを取得（RLSで自動フィルタリング）
    const [user] = await tx
      .select({ raindropAccessToken: users.raindropAccessToken })
      .from(users)
      .limit(1)

    return { items, user, totalCount: total.count }
  })

  // コレクション名を取得（APIから）
  let collectionMap = new Map<number, string>()
  if (user?.raindropAccessToken) {
    try {
      const collections = await getRaindropCollections(user.raindropAccessToken)
      collectionMap = createCollectionMap(collections)
    } catch (error) {
      console.error("[RaindropsPage] Failed to fetch collections:", error)
      // エラーが発生してもページは表示（コレクション名なしで）
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const prevPage = page > 1 ? page - 1 : null
  const nextPage = page < totalPages ? page + 1 : null

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8 sm:flex items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">記事一覧</h1>
          <p className="mt-2 text-sm text-slate-600">{totalCount}件の記事</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center gap-2 relative">
          <RefreshButton />
          <ImportButton />
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="px-4 py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Newspaper className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">まだ記事が取り込まれていません</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              「今すぐ取り込む」ボタンをクリックして、Raindrop.ioから記事を取り込んでください。
            </p>
          </div>
        </Card>
      ) : (
        <>
          <SearchableList items={items} collectionMap={collectionMap} />
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {page} / {totalPages} ページ
            </p>
            <div className="flex items-center gap-2">
              {prevPage ? (
                <Link
                  href={`/raindrops?page=${prevPage}`}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  前へ
                </Link>
              ) : null}
              {nextPage ? (
                <Link
                  href={`/raindrops?page=${nextPage}`}
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
