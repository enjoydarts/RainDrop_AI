"use client"

import { useEffect } from "react"
import { Realtime } from "ably"
import { toast } from "sonner"

interface AblyNotificationsProps {
  userId: string
}

export function AblyNotifications({ userId }: AblyNotificationsProps) {
  useEffect(() => {
    // Ablyクライアント作成
    const ably = new Realtime({
      key: process.env.NEXT_PUBLIC_ABLY_KEY!,
      clientId: userId,
    })

    // ユーザー専用チャンネルを購読
    const channel = ably.channels.get(`user:${userId}`)

    // 取込完了イベント
    channel.subscribe("import:completed", (message) => {
      const data = message.data
      toast.success("記事の取込が完了しました", {
        description: `${data.count || 0}件の記事を同期しました`,
        duration: Infinity, // 手動で閉じるまで表示
        action: {
          label: "確認",
          onClick: () => {
            window.location.reload()
          },
        },
        cancel: {
          label: "閉じる",
          onClick: () => {},
        },
      })
    })

    // 要約完了イベント
    channel.subscribe("summary:completed", (message) => {
      const data = message.data
      toast.success("要約が完了しました", {
        description: data.title ? `「${data.title}」の要約が完了しました` : undefined,
        duration: Infinity, // 手動で閉じるまで表示
        action: {
          label: "確認",
          onClick: () => {
            window.location.reload()
          },
        },
        cancel: {
          label: "閉じる",
          onClick: () => {},
        },
      })
    })

    // 要約失敗イベント
    channel.subscribe("summary:failed", (message) => {
      const data = message.data
      toast.error("要約に失敗しました", {
        description: data.error || "エラーが発生しました",
        duration: Infinity, // 手動で閉じるまで表示
        cancel: {
          label: "閉じる",
          onClick: () => {},
        },
      })
    })

    // クリーンアップ
    return () => {
      channel.unsubscribe()
      ably.close()
    }
  }, [userId])

  return null // UIは表示しない（通知のみ）
}
