"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteAllNotifications } from "./actions"
import { useState } from "react"

export function DeleteAllButton() {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    if (!confirm("すべての通知を削除しますか？この操作は取り消せません。")) {
      return
    }

    setIsPending(true)
    await deleteAllNotifications()
    setIsPending(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      {isPending ? "削除中..." : "すべて削除"}
    </Button>
  )
}
