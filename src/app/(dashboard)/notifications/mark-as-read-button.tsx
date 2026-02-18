"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { markAsRead } from "./actions"
import { useState } from "react"

interface MarkAsReadButtonProps {
  notificationId: string
}

export function MarkAsReadButton({ notificationId }: MarkAsReadButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    setIsPending(true)
    await markAsRead(notificationId)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs"
    >
      <Check className="h-3 w-3 mr-1" />
      {isPending ? "処理中..." : "既読にする"}
    </Button>
  )
}
