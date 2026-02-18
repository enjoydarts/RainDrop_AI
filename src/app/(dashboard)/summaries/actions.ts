"use server"

import { auth } from "@/auth"
import { withRLS } from "@/db/rls"
import { summaries } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { inngest } from "@/inngest/client"

export async function togglePublic(summaryId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id

  // RLS対応: 現在の公開状態を取得し、更新
  const result = await withRLS(userId, async (tx) => {
    // 現在の公開状態を取得（RLSで自動的に自分のデータのみ取得）
    const [summary] = await tx
      .select({ isPublic: summaries.isPublic })
      .from(summaries)
      .where(eq(summaries.id, summaryId))
      .limit(1)

    if (!summary) {
      throw new Error("Summary not found")
    }

    // 公開/非公開を切り替え
    const newIsPublic = summary.isPublic === 1 ? 0 : 1

    await tx
      .update(summaries)
      .set({
        isPublic: newIsPublic,
        updatedAt: new Date(),
      })
      .where(eq(summaries.id, summaryId))

    return { isPublic: newIsPublic === 1 }
  })

  revalidatePath("/summaries")

  return result
}

export async function retrySummary(summaryId: string, raindropId: number, tone: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id

  // 要約を抽出→生成の順で再試行
  await inngest.send({
    name: "raindrop/item.extract.requested",
    data: {
      userId,
      raindropId,
      summaryId,
      tone,
    },
  })

  revalidatePath("/summaries")
}
