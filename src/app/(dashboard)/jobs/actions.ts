"use server"

import { auth } from "@/auth"
import { inngest } from "@/inngest/client"
import { revalidatePath } from "next/cache"
import { withRLS } from "@/db/rls"
import { summaryJobs, summaries } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

type Tone = "snarky" | "neutral" | "enthusiastic" | "casual"

export async function retryJob(params: {
  jobId: string
  summaryId?: string | null
  raindropId: number
  tone: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id
  const safeTone: Tone =
    params.tone === "snarky" ||
    params.tone === "enthusiastic" ||
    params.tone === "casual"
      ? params.tone
      : "neutral"

  await withRLS(userId, async (tx) => {
    await tx
      .update(summaryJobs)
      .set({
        status: "pending",
        error: null,
        runCount: sql`${summaryJobs.runCount} + 1`,
        lastRunAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })
      .where(eq(summaryJobs.id, params.jobId))

    if (params.summaryId) {
      await tx
        .update(summaries)
        .set({
          status: "pending",
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(summaries.id, params.summaryId))
    }
  })

  await inngest.send({
    name: "raindrop/item.extract.requested",
    data: {
      userId,
      raindropId: params.raindropId,
      summaryId: params.summaryId || undefined,
      tone: safeTone,
    },
  })

  revalidatePath("/jobs")
  revalidatePath("/summaries")
}
