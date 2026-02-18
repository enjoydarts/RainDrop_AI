"use client"

import { useState } from "react"
import { RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { retrySummary } from "./actions"
import { toast } from "sonner"

interface RetryButtonProps {
  summaryId: string
  raindropId: number
  tone: string
}

export function RetryButton({ summaryId, raindropId, tone }: RetryButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleRetry = async () => {
    setLoading(true)

    try {
      await retrySummary(summaryId, raindropId, tone)
      toast.success("要約を再試行しています", {
        description: "処理には1-2分かかります。完了時に通知します。",
      })
    } catch (err) {
      console.error("[RetryButton] Error:", err)
      const message = err instanceof Error ? err.message : "再試行に失敗しました"
      toast.error("エラーが発生しました", {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleRetry}
      disabled={loading}
      className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "再試行中..." : "再試行"}
    </Button>
  )
}
