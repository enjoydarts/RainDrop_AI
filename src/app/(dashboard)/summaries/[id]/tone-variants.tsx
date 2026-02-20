"use client"

import { useState } from "react"
import Link from "next/link"
import { ClipboardList, Zap, Flame, MessageCircle, Plus, Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateSummary } from "@/app/(dashboard)/raindrops/actions"
import { toast } from "sonner"

const TONE_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "neutral", label: "客観的", Icon: ClipboardList },
  { value: "snarky", label: "毒舌", Icon: Zap },
  { value: "enthusiastic", label: "熱量高め", Icon: Flame },
  { value: "casual", label: "カジュアル", Icon: MessageCircle },
]

interface ToneSummary {
  id: string
  tone: string
  status: string
}

interface ToneVariantsProps {
  raindropId: number
  currentSummaryId: string
  currentTone: string
  existingSummaries: ToneSummary[]
}

export function ToneVariants({
  raindropId,
  currentSummaryId,
  currentTone,
  existingSummaries,
}: ToneVariantsProps) {
  const [generatingTone, setGeneratingTone] = useState<string | null>(null)

  const existingMap = new Map(existingSummaries.map((s) => [s.tone, s]))

  const handleGenerate = async (tone: string) => {
    setGeneratingTone(tone)
    try {
      await generateSummary(raindropId, tone)
      toast.success(`${TONE_OPTIONS.find((t) => t.value === tone)?.label}の要約生成を開始しました`, {
        description: "処理には1-2分かかります。完了時に通知します。",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "要約生成に失敗しました"
      toast.error("エラーが発生しました", { description: message })
    } finally {
      setGeneratingTone(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {TONE_OPTIONS.map(({ value, label, Icon }) => {
        const existing = existingMap.get(value)
        const isCurrent = value === currentTone

        if (existing) {
          return (
            <Link key={value} href={`/summaries/${existing.id}`}>
              <button
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  isCurrent
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : existing.status === "completed"
                    ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                    : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                {existing.status === "processing" || existing.status === "pending" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {label}
              </button>
            </Link>
          )
        }

        return (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => handleGenerate(value)}
            disabled={generatingTone !== null}
            className="gap-1.5 text-slate-500 border-dashed hover:border-indigo-300 hover:text-indigo-600"
          >
            {generatingTone === value ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        )
      })}
    </div>
  )
}
