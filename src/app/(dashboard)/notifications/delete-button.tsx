"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { deleteNotification } from "./actions"
import { useState } from "react"

interface DeleteButtonProps {
  notificationId: string
}

export function DeleteButton({ notificationId }: DeleteButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setIsPending(true)
    await deleteNotification(notificationId)
    setIsPending(false)
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-slate-500 hover:text-red-600"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>通知を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。通知が完全に削除されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "削除中..." : "削除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
