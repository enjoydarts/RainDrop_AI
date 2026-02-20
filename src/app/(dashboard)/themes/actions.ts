"use server"

import { auth } from "@/auth"
import { withRLS } from "@/db/rls"
import { summaries } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

/**
 * テーマ名を変更（同名の別テーマへの統合も含む）
 */
export async function renameTheme(oldTheme: string, newTheme: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const trimmed = newTheme.trim()
  if (!trimmed) throw new Error("テーマ名を入力してください")
  if (trimmed === oldTheme) return

  const userId = session.user.id

  await withRLS(userId, async (tx) => {
    await tx
      .update(summaries)
      .set({ theme: trimmed, updatedAt: new Date() })
      .where(and(eq(summaries.userId, userId), eq(summaries.theme, oldTheme)))
  })

  revalidatePath("/themes")
  revalidatePath("/summaries")
}

/**
 * テーマを削除（該当要約のthemeをnullに設定）
 */
export async function deleteTheme(theme: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const userId = session.user.id

  await withRLS(userId, async (tx) => {
    await tx
      .update(summaries)
      .set({ theme: null, updatedAt: new Date() })
      .where(and(eq(summaries.userId, userId), eq(summaries.theme, theme)))
  })

  revalidatePath("/themes")
  revalidatePath("/summaries")
}
