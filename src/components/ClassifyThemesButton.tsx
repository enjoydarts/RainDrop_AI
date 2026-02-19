"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ClassifyThemesButton() {
  const router = useRouter()
  const [isClassifying, setIsClassifying] = useState(false)

  const handleClassify = async () => {
    setIsClassifying(true)

    try {
      const res = await fetch("/api/classify-themes", {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error("テーマ分類の開始に失敗しました")
      }

      toast.success("テーマ分類を開始しました", {
        description: "バックグラウンドで処理中です。完了までお待ちください。",
        duration: 5000,
      })

      // ページをリフレッシュ
      router.refresh()
    } catch (error) {
      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      })
    } finally {
      setIsClassifying(false)
    }
  }

  return (
    <Button
      onClick={handleClassify}
      disabled={isClassifying}
      variant="outline"
      className="border-purple-200 hover:bg-purple-50"
    >
      {isClassifying ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          分類中...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          テーマを自動分類
        </>
      )}
    </Button>
  )
}
