"use client"

import { useState, useTransition } from "react"
import { DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { setMonthlyBudgetUsd } from "@/app/(dashboard)/actions"
import { toast } from "sonner"

interface BudgetSettingsProps {
  initialBudgetUsd: number
}

export function BudgetSettings({ initialBudgetUsd }: BudgetSettingsProps) {
  const [value, setValue] = useState(initialBudgetUsd > 0 ? initialBudgetUsd.toString() : "")
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      try {
        await setMonthlyBudgetUsd(value)
        toast.success("月次予算を更新しました")
      } catch {
        toast.error("月次予算の更新に失敗しました")
      }
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">月次予算ガード</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        0 または空欄で無効化できます
      </p>
      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="pl-9"
            placeholder="20.00"
          />
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          保存
        </Button>
      </div>
    </div>
  )
}
