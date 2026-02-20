"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { saveAccountSettings } from "./actions"
import { toast } from "sonner"

interface CollectionOption {
  id: number
  name: string
}

interface SettingsFormProps {
  initialBudgetUsd: number
  initialTone: string
  initialNotificationsEnabled: boolean
  initialCollectionId: number | null
  hasAnthropicApiKey: boolean
  hasOpenaiApiKey: boolean
  collections: CollectionOption[]
}

export function SettingsForm({
  initialBudgetUsd,
  initialTone,
  initialNotificationsEnabled,
  initialCollectionId,
  hasAnthropicApiKey,
  hasOpenaiApiKey,
  collections,
}: SettingsFormProps) {
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState(
    initialBudgetUsd > 0 ? initialBudgetUsd.toString() : ""
  )
  const [defaultSummaryTone, setDefaultSummaryTone] = useState(initialTone)
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialNotificationsEnabled
  )
  const [defaultImportCollectionId, setDefaultImportCollectionId] = useState(
    initialCollectionId ? String(initialCollectionId) : ""
  )
  const [anthropicApiKey, setAnthropicApiKey] = useState("")
  const [openaiApiKey, setOpenaiApiKey] = useState("")
  const [clearAnthropicApiKey, setClearAnthropicApiKey] = useState(false)
  const [clearOpenaiApiKey, setClearOpenaiApiKey] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        monthlyBudgetUsd: initialBudgetUsd > 0 ? initialBudgetUsd.toString() : "",
        defaultSummaryTone: initialTone,
        notificationsEnabled: initialNotificationsEnabled,
        defaultImportCollectionId: initialCollectionId ? String(initialCollectionId) : "",
      }),
    [initialBudgetUsd, initialCollectionId, initialNotificationsEnabled, initialTone]
  )
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(initialSnapshot)
  const [isPending, startTransition] = useTransition()

  const currentSnapshot = JSON.stringify({
    monthlyBudgetUsd,
    defaultSummaryTone,
    notificationsEnabled,
    defaultImportCollectionId,
  })
  const hasUnsavedChanges =
    currentSnapshot !== lastSavedSnapshot ||
    anthropicApiKey.trim().length > 0 ||
    openaiApiKey.trim().length > 0 ||
    clearAnthropicApiKey ||
    clearOpenaiApiKey

  const handleSave = () => {
    setSaveState("saving")
    startTransition(async () => {
      try {
        await saveAccountSettings({
          monthlyBudgetUsd,
          defaultSummaryTone,
          notificationsEnabled,
          defaultImportCollectionId,
          anthropicApiKey,
          openaiApiKey,
          clearAnthropicApiKey,
          clearOpenaiApiKey,
        })
        setAnthropicApiKey("")
        setOpenaiApiKey("")
        setClearAnthropicApiKey(false)
        setClearOpenaiApiKey(false)
        setLastSavedSnapshot(currentSnapshot)
        setSaveState("saved")
        toast.success("設定を保存しました")
      } catch (error) {
        setSaveState("error")
        toast.error("設定の保存に失敗しました")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">要約設定</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              既定トーン
            </span>
            <select
              value={defaultSummaryTone}
              onChange={(e) => setDefaultSummaryTone(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="neutral">客観的</option>
              <option value="snarky">毒舌</option>
              <option value="enthusiastic">熱量高め</option>
              <option value="casual">カジュアル</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              月次予算 (USD)
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={monthlyBudgetUsd}
              onChange={(e) => setMonthlyBudgetUsd(e.target.value)}
              placeholder="未設定で無制限"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">同期設定</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              既定の同期コレクション
            </span>
            <select
              value={defaultImportCollectionId}
              onChange={(e) => setDefaultImportCollectionId(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">すべてのコレクション</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">APIキー設定</h2>
        <p className="mt-1 text-xs text-slate-500">
          APIキーは暗号化して保存されます。未入力で保存すると既存値を保持します。
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Anthropic API Key
            </span>
            <Input
              type="password"
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
              placeholder={hasAnthropicApiKey ? "設定済み（更新する場合のみ入力）" : "sk-ant-..."}
              disabled={clearAnthropicApiKey}
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={clearAnthropicApiKey}
                onChange={(e) => setClearAnthropicApiKey(e.target.checked)}
              />
              Anthropic APIキーを削除
            </label>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              OpenAI API Key
            </span>
            <Input
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder={hasOpenaiApiKey ? "設定済み（更新する場合のみ入力）" : "sk-..."}
              disabled={clearOpenaiApiKey}
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={clearOpenaiApiKey}
                onChange={(e) => setClearOpenaiApiKey(e.target.checked)}
              />
              OpenAI APIキーを削除
            </label>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">通知設定</h2>
        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            要約や取り込みの通知を受け取る
          </span>
        </label>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || !hasUnsavedChanges}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            保存
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {saveState === "saving" && "保存中..."}
            {saveState === "saved" && "保存済み"}
            {saveState === "error" && "保存に失敗しました"}
            {saveState !== "saving" && hasUnsavedChanges && "未保存の変更があります"}
            {saveState === "idle" && !hasUnsavedChanges && "変更はありません"}
          </span>
        </div>
      </div>
    </div>
  )
}
