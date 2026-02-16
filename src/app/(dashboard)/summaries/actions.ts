"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { summaries } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function togglePublic(summaryId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id

  // 現在の公開状態を取得
  const [summary] = await db
    .select({ isPublic: summaries.isPublic })
    .from(summaries)
    .where(and(eq(summaries.id, summaryId), eq(summaries.userId, userId)))
    .limit(1)

  if (!summary) {
    throw new Error("Summary not found")
  }

  // 公開/非公開を切り替え
  const newIsPublic = summary.isPublic === 1 ? 0 : 1

  await db
    .update(summaries)
    .set({
      isPublic: newIsPublic,
      updatedAt: new Date(),
    })
    .where(and(eq(summaries.id, summaryId), eq(summaries.userId, userId)))

  revalidatePath("/summaries")

  return { isPublic: newIsPublic === 1 }
}
