import { notFound } from "next/navigation"
import { withAnonymous } from "@/db/rls"
import { summaries, raindrops } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import Image from "next/image"
import Link from "next/link"
import { ClipboardList, Zap, Flame, MessageCircle, FileText } from "lucide-react"
import { headers } from "next/headers"
import { ShareButtons } from "./share-buttons"

const TONE_LABELS = {
  neutral: { label: "客観的", Icon: ClipboardList },
  snarky: { label: "毒舌", Icon: Zap },
  enthusiastic: { label: "熱量高め", Icon: Flame },
  casual: { label: "カジュアル", Icon: MessageCircle },
} as const

export default async function SharedSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 現在のURLを取得
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
  const currentUrl = `${protocol}://${host}/share/${id}`

  // 公開された要約を取得（匿名アクセス、RLSで公開要約のみ取得）
  const [summary] = await withAnonymous(async (tx) => {
    return await tx
      .select({
        id: summaries.id,
        summary: summaries.summary,
        tone: summaries.tone,
        rating: summaries.rating,
        ratingReason: summaries.ratingReason,
        model: summaries.model,
        createdAt: summaries.createdAt,
        articleTitle: raindrops.title,
        articleLink: raindrops.link,
        articleCover: raindrops.cover,
        articleExcerpt: raindrops.excerpt,
      })
      .from(summaries)
      .innerJoin(
        raindrops,
        and(eq(summaries.raindropId, raindrops.id), eq(summaries.userId, raindrops.userId))
      )
      .where(and(eq(summaries.id, id), eq(summaries.isPublic, 1)))
      .limit(1)
  })

  if (!summary) {
    notFound()
  }

  const toneInfo = TONE_LABELS[summary.tone as keyof typeof TONE_LABELS] || {
    label: summary.tone,
    Icon: FileText
  }
  const ToneIcon = toneInfo.Icon

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Raindary" width={32} height={32} />
              <h1 className="text-2xl font-bold text-indigo-600">Raindary</h1>
            </div>
            <Link
              href="/"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              自分も使ってみる →
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* カバー画像 */}
          {summary.articleCover && (
            <div className="relative aspect-[21/9] overflow-hidden bg-slate-100">
              <Image
                src={summary.articleCover}
                alt=""
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* 記事タイトル */}
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              {summary.articleTitle}
            </h1>

            {/* メタ情報 */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-slate-200">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                <ToneIcon className="h-3.5 w-3.5" />
                {toneInfo.label}
              </span>
              {summary.rating && (
                <span className="text-yellow-400 text-sm">
                  {"★".repeat(summary.rating)}{"☆".repeat(5 - summary.rating)}
                </span>
              )}
              <span className="text-sm text-slate-500">
                {new Date(summary.createdAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* 要約 */}
            <div className="prose prose-lg max-w-none">
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                {summary.summary}
              </p>
            </div>

            {/* 評価理由 */}
            {summary.ratingReason && (
              <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  評価理由
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {summary.ratingReason}
                </p>
              </div>
            )}

            {/* SNSシェアボタン */}
            <ShareButtons
              url={currentUrl}
              title={summary.articleTitle}
              text={summary.summary.substring(0, 100)}
            />

            {/* 元記事へのリンク */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <a
                href={summary.articleLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                元記事を読む
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            {/* フッター */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                この要約は{" "}
                <Link href="/" className="text-indigo-600 hover:text-indigo-700">
                  Raindary
                </Link>{" "}
                で生成されました（モデル: {summary.model}）
              </p>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [summary] = await withAnonymous(async (tx) => {
    return await tx
      .select({
        articleTitle: raindrops.title,
        articleCover: raindrops.cover,
        summary: summaries.summary,
      })
      .from(summaries)
      .innerJoin(
        raindrops,
        and(eq(summaries.raindropId, raindrops.id), eq(summaries.userId, raindrops.userId))
      )
      .where(and(eq(summaries.id, id), eq(summaries.isPublic, 1)))
      .limit(1)
  })

  if (!summary) {
    return {
      title: "要約が見つかりません",
    }
  }

  const title = `${summary.articleTitle} - Raindary要約`
  const description = summary.summary.substring(0, 160)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: summary.articleCover ? [{ url: summary.articleCover }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: summary.articleCover ? [summary.articleCover] : [],
    },
  }
}
