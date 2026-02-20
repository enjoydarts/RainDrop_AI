"use client"

import { useState } from "react"
import { CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markAllAsRead } from "./actions"

export function MarkAllAsReadButton() {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    setIsPending(true)
    await markAllAsRead()
    setIsPending(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="text-indigo-700 hover:bg-indigo-50"
    >
      <CheckCheck className="mr-2 h-4 w-4" />
      {isPending ? "処理中..." : "すべて既読"}
    </Button>
  )
}
