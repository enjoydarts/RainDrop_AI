"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function RegenerateThemesButton() {
  const router = useRouter()
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setShowConfirm(false)

    try {
      const res = await fetch("/api/classify-themes?force=true", {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error("テーマ再生成の開始に失敗しました")
      }

      toast.success("テーマ再生成を開始しました", {
        description: "全ての要約を再分類しています。完了までお待ちください。",
        duration: 5000,
      })

      // ページをリフレッシュ
      router.refresh()
    } catch (error) {
      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowConfirm(true)}
        disabled={isRegenerating}
        variant="outline"
        className="border-orange-200 hover:bg-orange-50"
      >
        {isRegenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            再生成中...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            テーマを再生成
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>テーマを再生成しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              全ての要約のテーマをリセットして、再度自動分類を実行します。
              <br />
              <br />
              <strong className="text-orange-600">
                ⚠️ 手動で設定したテーマも含めて、全て上書きされます。
              </strong>
              <br />
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerate}
              className="bg-orange-600 hover:bg-orange-700"
            >
              再生成する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
