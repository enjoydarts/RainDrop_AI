import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, ClipboardList, Zap, Flame, MessageCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { RelatedSummary } from "@/lib/related-summaries"

const TONE_LABELS: Record<string, { label: string; Icon: LucideIcon }> = {
  neutral: { label: "客観的", Icon: ClipboardList },
  snarky: { label: "毒舌", Icon: Zap },
  enthusiastic: { label: "熱量高め", Icon: Flame },
  casual: { label: "カジュアル", Icon: MessageCircle },
}

interface RelatedSummariesProps {
  summaries: RelatedSummary[]
}

export function RelatedSummaries({ summaries }: RelatedSummariesProps) {
  if (summaries.length === 0) {
    return null
  }

  return (
    <div className="mt-12 pt-8 border-t border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">関連記事</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaries.map((summary) => {
          const toneInfo = TONE_LABELS[summary.tone] || { label: summary.tone, Icon: FileText }
          const ToneIcon = toneInfo.Icon

          return (
            <Link key={summary.id} href={`/summaries/${summary.id}`}>
              <Card className="h-full card-hover cursor-pointer">
                <CardContent className="p-0">
                  {/* カバー画像 */}
                  {summary.articleCover ? (
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      <Image
                        src={summary.articleCover}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-slate-100 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-slate-300" />
                    </div>
                  )}

                  {/* コンテンツ */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2">
                      {summary.articleTitle}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {summary.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-indigo-600">
                        <ToneIcon className="h-3 w-3" />
                        {toneInfo.label}
                      </span>
                      {summary.rating && (
                        <span className="text-xs text-yellow-400">
                          {"★".repeat(summary.rating)}
                        </span>
                      )}
                    </div>
                    {/* 類似度表示（デバッグ用、後で削除可） */}
                    <div className="mt-2 text-xs text-slate-400">
                      類似度: {(summary.similarity * 100).toFixed(1)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
