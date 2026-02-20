"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export function KeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: 検索にフォーカス
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]')
        searchInput?.focus()
        return
      }

      // 入力中は無視
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // /: 検索にフォーカス
      if (e.key === "/") {
        e.preventDefault()
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]')
        searchInput?.focus()
        return
      }

      // d: ダッシュボード
      if (e.key === "d" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push("/dashboard")
        return
      }

      // r: 記事一覧
      if (e.key === "r" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push("/raindrops")
        return
      }

      // s: 要約一覧
      if (e.key === "s" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push("/summaries")
        return
      }

      // j: ジョブ管理
      if (e.key === "j" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push("/jobs")
        return
      }

      // n: 通知
      if (e.key === "n" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push("/notifications")
        return
      }

      // t: 統計
      if (e.key === "t" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push("/stats")
        return
      }

      // o: 設定
      if (e.key === "o" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push("/settings")
        return
      }

      // r: ページをリフレッシュ
      if (e.key === "r" && !e.shiftKey && !e.metaKey && !e.ctrlKey && pathname !== "/raindrops") {
        e.preventDefault()
        router.refresh()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router, pathname])

  return null
}
