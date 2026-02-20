"use client"

import { useState, useTransition } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { saveSummaryFeedback } from "./actions"
import { toast } from "sonner"

interface FeedbackFormProps {
  summaryId: string
  initialRating: number | null
  initialFeedback: string | null
}

export function FeedbackForm({
  summaryId,
  initialRating,
  initialFeedback,
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(initialRating)
  const [feedback, setFeedback] = useState(initialFeedback ?? "")
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveSummaryFeedback(summaryId, { rating, feedback })
        toast.success("フィードバックを保存しました")
      } catch (error) {
        toast.error("保存に失敗しました")
      }
    })
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">この要約の改善フィードバック</h3>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className="p-1"
            aria-label={`${value} stars`}
          >
            <Star
              className={`h-5 w-5 ${
                rating && value <= rating ? "fill-yellow-400 text-yellow-500" : "text-slate-300"
              }`}
            />
          </button>
        ))}
      </div>
      <Input
        className="mt-3"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="改善したい点を入力（例: 具体例を増やしてほしい）"
      />
      <div className="mt-3">
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          保存
        </Button>
      </div>
    </div>
  )
}
