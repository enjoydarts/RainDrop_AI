"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteNotification } from "./actions"
import { useState } from "react"

interface DeleteButtonProps {
  notificationId: string
}

export function DeleteButton({ notificationId }: DeleteButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    if (!confirm("この通知を削除しますか？")) {
      return
    }

    setIsPending(true)
    await deleteNotification(notificationId)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-slate-500 hover:text-red-600"
    >
      <Trash2 className="h-3 w-3 mr-1" />
      {isPending ? "削除中..." : "削除"}
    </Button>
  )
}
