"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ClipboardList,
  Flame,
  type LucideIcon,
  MessageCircle,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RetryJobButton } from "./retry-job-button"

interface JobItem {
  jobId: string
  summaryId: string | null
  raindropId: number
  tone: string
  status: string
  error: string | null
  updatedAt: Date
  title: string
}

interface JobListProps {
  jobs: JobItem[]
  statusCounts: Record<string, number>
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待機中",
  processing: "処理中",
  completed: "完了",
  failed: "失敗",
}

const TONE_META: Record<
  string,
  { label: string; Icon: LucideIcon }
> = {
  neutral: { label: "客観的", Icon: ClipboardList },
  snarky: { label: "毒舌", Icon: Zap },
  enthusiastic: { label: "熱量高め", Icon: Flame },
  casual: { label: "カジュアル", Icon: MessageCircle },
}

export function JobList({ jobs, statusCounts }: JobListProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [toneFilter, setToneFilter] = useState<string | null>(null)

  useEffect(() => {
    const hasInFlight = jobs.some(
      (job) => job.status === "processing" || job.status === "pending"
    )
    if (!hasInFlight) {
      return
    }

    const timer = setInterval(() => {
      router.refresh()
    }, 15000)

    return () => clearInterval(timer)
  }, [jobs, router])

  const tones = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.tone))).sort(),
    [jobs]
  )

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter && job.status !== statusFilter) {
        return false
      }
      if (toneFilter && job.tone !== toneFilter) {
        return false
      }
      return true
    })
  }, [jobs, statusFilter, toneFilter])

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["pending", "processing", "failed", "completed"].map((status) => (
          <Card key={status} className="p-4">
            <p className="text-xs text-slate-500">{STATUS_LABELS[status] || status}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {statusCounts[status] || 0}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={statusFilter === null ? "default" : "outline"}
          className={statusFilter === null ? "bg-slate-700 hover:bg-slate-800" : ""}
          onClick={() => setStatusFilter(null)}
        >
          全ステータス
        </Button>
        {["pending", "processing", "failed", "completed"].map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "default" : "outline"}
            className={statusFilter === status ? "bg-slate-700 hover:bg-slate-800" : ""}
            onClick={() => setStatusFilter(status)}
          >
            {STATUS_LABELS[status] || status}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={toneFilter === null ? "default" : "outline"}
          className={toneFilter === null ? "bg-indigo-600 hover:bg-indigo-700" : ""}
          onClick={() => setToneFilter(null)}
        >
          全トーン
        </Button>
        {tones.map((tone) => (
          (() => {
            const toneMeta = TONE_META[tone]
            const ToneIcon = toneMeta?.Icon
            return (
          <Button
            key={tone}
            size="sm"
            variant={toneFilter === tone ? "default" : "outline"}
            className={toneFilter === tone ? "bg-indigo-600 hover:bg-indigo-700" : ""}
            onClick={() => setToneFilter(tone)}
          >
            {ToneIcon ? <ToneIcon className="mr-1.5 h-3.5 w-3.5" /> : null}
            {toneMeta?.label || tone}
          </Button>
            )
          })()
        ))}
      </div>

      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <Card key={job.jobId} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {job.title || "無題の記事"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge variant="secondary">{STATUS_LABELS[job.status] || job.status}</Badge>
                  <Badge variant="outline">
                    {(() => {
                      const toneMeta = TONE_META[job.tone]
                      const ToneIcon = toneMeta?.Icon
                      return (
                        <>
                          {ToneIcon ? <ToneIcon className="mr-1 h-3 w-3" /> : null}
                          {toneMeta?.label || job.tone}
                        </>
                      )
                    })()}
                  </Badge>
                  <span>Job ID: {job.jobId.slice(0, 8)}</span>
                  <span>
                    更新:{" "}
                    {new Date(job.updatedAt).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}
                  </span>
                </div>
                {job.error && (
                  <p className="mt-2 line-clamp-2 text-xs text-red-600 dark:text-red-400">{job.error}</p>
                )}
              </div>
              {job.status === "failed" && (
                <div className="flex items-center gap-2">
                  {job.summaryId ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/summaries/${job.summaryId}`}>要約詳細へ</Link>
                    </Button>
                  ) : null}
                  <RetryJobButton
                    jobId={job.jobId}
                    summaryId={job.summaryId}
                    raindropId={job.raindropId}
                    tone={job.tone}
                  />
                </div>
              )}
              {job.status !== "failed" && job.summaryId && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/summaries/${job.summaryId}`}>要約詳細へ</Link>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
