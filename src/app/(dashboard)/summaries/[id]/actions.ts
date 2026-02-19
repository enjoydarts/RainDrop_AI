"use server"

import { auth } from "@/auth"
import { withRLS } from "@/db/rls"
import { summaries } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

/**
 * 要約のテーマを更新
 */
export async function updateTheme(summaryId: string, theme: string | null) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id

  await withRLS(userId, async (tx) => {
    await tx
      .update(summaries)
      .set({ theme, updatedAt: new Date() })
      .where(eq(summaries.id, summaryId))
  })

  revalidatePath(`/summaries/${summaryId}`)
  revalidatePath("/summaries")
}

/**
 * 要約に対するユーザーフィードバックを保存
 */
export async function saveSummaryFeedback(
  summaryId: string,
  payload: { rating: number | null; feedback: string | null }
) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id

  const safeRating =
    payload.rating && payload.rating >= 1 && payload.rating <= 5 ? payload.rating : null
  const safeFeedback = payload.feedback?.trim() ? payload.feedback.trim() : null

  await withRLS(userId, async (tx) => {
    await tx
      .update(summaries)
      .set({
        userRating: safeRating,
        userFeedback: safeFeedback,
        updatedAt: new Date(),
      })
      .where(eq(summaries.id, summaryId))
  })

  revalidatePath(`/summaries/${summaryId}`)
  revalidatePath("/summaries")
}
