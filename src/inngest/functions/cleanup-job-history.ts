import { inngest } from "../client"
import { db } from "@/db"
import { summaryJobs } from "@/db/schema"
import { and, eq, isNull, lt } from "drizzle-orm"

function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

const COMPLETED_RETENTION_DAYS = Number(process.env.JOBS_RETENTION_COMPLETED_DAYS || "90")
const FAILED_RETENTION_DAYS = Number(process.env.JOBS_RETENTION_FAILED_DAYS || "180")

/**
 * ジョブ履歴クリーンアップ
 * - completed: 既定90日で論理削除
 * - failed: 既定180日で論理削除
 */
export const cleanupJobHistory = inngest.createFunction(
  {
    id: "cleanup-job-history",
    retries: 1,
  },
  { cron: "TZ=Asia/Tokyo 0 2 * * *" }, // 毎日JST 02:00
  async ({ step }) => {
    const completedThreshold = daysAgo(COMPLETED_RETENTION_DAYS)
    const failedThreshold = daysAgo(FAILED_RETENTION_DAYS)

    const completedDeleted = await step.run("cleanup-completed-jobs", async () => {
      const rows = await db
        .update(summaryJobs)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            isNull(summaryJobs.deletedAt),
            eq(summaryJobs.status, "completed"),
            lt(summaryJobs.updatedAt, completedThreshold)
          )
        )
        .returning({ id: summaryJobs.id })

      return rows.length
    })

    const failedDeleted = await step.run("cleanup-failed-jobs", async () => {
      const rows = await db
        .update(summaryJobs)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            isNull(summaryJobs.deletedAt),
            eq(summaryJobs.status, "failed"),
            lt(summaryJobs.updatedAt, failedThreshold)
          )
        )
        .returning({ id: summaryJobs.id })

      return rows.length
    })

    return {
      success: true,
      completedDeleted,
      failedDeleted,
      retentionDays: {
        completed: COMPLETED_RETENTION_DAYS,
        failed: FAILED_RETENTION_DAYS,
      },
    }
  }
)
