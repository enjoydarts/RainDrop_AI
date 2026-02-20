"use client"

import { useState } from "react"
import { Cpu, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RegenerateEmbeddingsButtonProps {
  initialCount: number
  hasOpenaiApiKey: boolean
}

export function RegenerateEmbeddingsButton({
  initialCount,
  hasOpenaiApiKey,
}: RegenerateEmbeddingsButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleRegenerate = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/embeddings/regenerate", { method: "POST" })
      if (!res.ok) throw new Error("Failed to start job")
      setIsDone(true)
      setCount(0)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasOpenaiApiKey) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        OpenAI APIキーが設定されていないため使用できません。
      </p>
    )
  }

  if (isDone) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        バックグラウンドで生成中です。完了後に通知が届きます。
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        エンベディング未生成:{" "}
        <span className={count > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : "font-semibold"}>
          {count}件
        </span>
      </p>
      <Button
        onClick={handleRegenerate}
        disabled={isLoading || count === 0}
        variant="outline"
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            起動中...
          </>
        ) : (
          <>
            <Cpu className="h-4 w-4 mr-2" />
            一括生成を開始
          </>
        )}
      </Button>
    </div>
  )
}
