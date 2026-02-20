"use client"

import { useEffect, useRef } from "react"
import { Realtime } from "ably"
import { toast } from "sonner"

interface AblyNotificationsProps {
  userId: string
}

export function AblyNotifications({ userId }: AblyNotificationsProps) {
  // 処理済みメッセージIDを保持（重複排除用）
  const processedMessageIds = useRef(new Set<string>())

  const shouldSkipAsDuplicate = (messageId?: string) => {
    if (!messageId) {
      return false
    }
    if (processedMessageIds.current.has(messageId)) {
      console.log(`[ably] Duplicate message ignored: ${messageId}`)
      return true
    }
    processedMessageIds.current.add(messageId)
    return false
  }

  useEffect(() => {
    // Ablyクライアント作成（Token Authentication使用）
    const ably = new Realtime({
      authUrl: "/api/ably-token",
      authMethod: "GET",
    })

    // ユーザー専用チャンネルを購読
    const channel = ably.channels.get(`user:${userId}`)

    // 取込完了イベント
    channel.subscribe("import:completed", (message) => {
      // 重複チェック
      if (shouldSkipAsDuplicate(message.id)) {
        return
      }

      const data = message.data
      const count = data.count || 0
      const extractRequested = data.extractRequested || 0
      toast.success("記事の取込が完了しました", {
        description:
          count > 0
            ? `新規に${count}件の記事を取り込み、${extractRequested}件を要約キューに追加しました。ページを更新して確認してください。`
            : "新規記事はありませんでした。",
        duration: Infinity, // 手動で閉じるまで表示
      })
    })

    // 要約完了イベント
    channel.subscribe("summary:completed", (message) => {
      // 重複チェック
      if (shouldSkipAsDuplicate(message.id)) {
        return
      }

      const data = message.data
      toast.success("要約が完了しました", {
        description: data.title
          ? `「${data.title}」の要約が完了しました。ページを更新して確認してください。`
          : "ページを更新して確認してください。",
        duration: Infinity, // 手動で閉じるまで表示
      })
    })

    // 要約失敗イベント
    channel.subscribe("summary:failed", (message) => {
      // 重複チェック
      if (shouldSkipAsDuplicate(message.id)) {
        return
      }

      const data = message.data
      toast.error("要約に失敗しました", {
        description: data.error || "エラーが発生しました",
        duration: Infinity, // 手動で閉じるまで表示
      })
    })

    // テーマ分類完了イベント
    channel.subscribe("themes:completed", (message) => {
      // 重複チェック
      if (shouldSkipAsDuplicate(message.id)) {
        return
      }

      const data = message.data
      const count = data.count || 0
      toast.success("テーマ分類が完了しました", {
        description:
          count > 0
            ? `${count}件の要約にテーマを割り当てました。ページを更新して確認してください。`
            : "分類対象の要約がありませんでした。",
        duration: Infinity, // 手動で閉じるまで表示
      })
    })

    // テーマ分類失敗イベント
    channel.subscribe("themes:failed", (message) => {
      // 重複チェック
      if (shouldSkipAsDuplicate(message.id)) {
        return
      }

      const data = message.data
      toast.error("テーマ分類に失敗しました", {
        description: data.error || "エラーが発生しました",
        duration: Infinity, // 手動で閉じるまで表示
      })
    })

    // ダイジェスト生成完了イベント
    channel.subscribe("digest:completed", (message) => {
      if (shouldSkipAsDuplicate(message.id)) {
        return
      }

      const data = message.data
      const summaryCount = data.summaryCount || 0
      toast.success("ダイジェスト生成が完了しました", {
        description:
          summaryCount > 0
            ? `${summaryCount}件の要約からダイジェストを作成しました。`
            : "ダイジェスト生成が完了しました。",
        duration: Infinity,
      })
    })

    // ダイジェスト生成失敗イベント
    channel.subscribe("digest:failed", (message) => {
      if (shouldSkipAsDuplicate(message.id)) {
        return
      }

      const data = message.data
      toast.error("ダイジェスト生成に失敗しました", {
        description: data.error || "エラーが発生しました",
        duration: Infinity,
      })
    })

    // クリーンアップ
    return () => {
      try {
        channel.unsubscribe()
        ably.close()
      } catch (error) {
        // Ably接続エラーを無視（開発環境でよく発生）
        console.debug("[ably] Connection cleanup error:", error)
      }
    }
  }, [userId])

  return null // UIは表示しない（通知のみ）
}
