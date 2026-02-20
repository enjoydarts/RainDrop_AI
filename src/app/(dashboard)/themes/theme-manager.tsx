"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, Trash2, Check, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { renameTheme, deleteTheme } from "./actions"
import { toast } from "sonner"

interface ThemeStat {
  theme: string
  count: number
  lastUpdated: Date | null
}

interface ThemeManagerProps {
  themes: ThemeStat[]
}

export function ThemeManager({ themes }: ThemeManagerProps) {
  const [editingTheme, setEditingTheme] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [deletingTheme, setDeletingTheme] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleStartEdit = (theme: string) => {
    setEditingTheme(theme)
    setEditValue(theme)
    setDeletingTheme(null)
  }

  const handleCancelEdit = () => {
    setEditingTheme(null)
    setEditValue("")
  }

  const handleRename = async (oldTheme: string) => {
    if (!editValue.trim() || editValue.trim() === oldTheme) {
      handleCancelEdit()
      return
    }
    setLoading(true)
    try {
      await renameTheme(oldTheme, editValue.trim())
      toast.success("テーマ名を変更しました", {
        description: `「${oldTheme}」→「${editValue.trim()}」`,
      })
      setEditingTheme(null)
    } catch (err) {
      toast.error("変更に失敗しました", {
        description: err instanceof Error ? err.message : "不明なエラー",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (theme: string) => {
    setLoading(true)
    try {
      await deleteTheme(theme)
      toast.success("テーマを削除しました", {
        description: `「${theme}」の要約からテーマ分類が解除されました`,
      })
      setDeletingTheme(null)
    } catch (err) {
      toast.error("削除に失敗しました", {
        description: err instanceof Error ? err.message : "不明なエラー",
      })
    } finally {
      setLoading(false)
    }
  }

  if (themes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-16 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">テーマがありません</h3>
        <p className="text-sm text-slate-500 mb-4">
          要約一覧でテーマを分類すると、ここに表示されます。
        </p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/summaries">要約一覧へ</Link>
        </Button>
      </div>
    )
  }

  // テーマ行の共通アクション部分
  const renderActions = (t: ThemeStat) => {
    if (deletingTheme === t.theme) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-red-600">本当に削除しますか?</span>
          <button
            onClick={() => handleDelete(t.theme)}
            disabled={loading}
            className="text-xs text-red-600 font-medium hover:text-red-700 disabled:opacity-50"
          >
            削除
          </button>
          <button
            onClick={() => setDeletingTheme(null)}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            キャンセル
          </button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleStartEdit(t.theme)}
          disabled={loading || editingTheme !== null}
          className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
          title="テーマ名を変更"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setDeletingTheme(t.theme); setEditingTheme(null) }}
          disabled={loading || editingTheme !== null}
          className="text-slate-400 hover:text-red-600 disabled:opacity-30 transition-colors"
          title="テーマを削除"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  const renderNameCell = (t: ThemeStat) => {
    if (editingTheme === t.theme) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename(t.theme)
              if (e.key === "Escape") handleCancelEdit()
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <button
            onClick={() => handleRename(t.theme)}
            disabled={loading}
            className="text-green-600 hover:text-green-700 disabled:opacity-50 flex-shrink-0"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )
    }
    return (
      <Link href="/summaries" className="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors">
        {t.theme}
      </Link>
    )
  }

  return (
    <>
      {/* モバイル: カードレイアウト */}
      <div className="sm:hidden space-y-3">
        {themes.map((t) => (
          <div key={t.theme} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                {renderNameCell(t)}
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {t.count}件
              </Badge>
            </div>
            {t.lastUpdated && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                {new Date(t.lastUpdated).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  timeZone: "Asia/Tokyo",
                })}
              </p>
            )}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              {renderActions(t)}
            </div>
          </div>
        ))}
      </div>

      {/* デスクトップ: テーブルレイアウト */}
      <div className="hidden sm:block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                テーマ名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                要約数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                最終更新
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {themes.map((t) => (
              <tr key={t.theme} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <td className="px-6 py-4">{renderNameCell(t)}</td>
                <td className="px-6 py-4">
                  <Badge variant="secondary" className="text-xs">
                    {t.count}件
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {t.lastUpdated
                    ? new Date(t.lastUpdated).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        timeZone: "Asia/Tokyo",
                      })
                    : "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end">
                    {renderActions(t)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
