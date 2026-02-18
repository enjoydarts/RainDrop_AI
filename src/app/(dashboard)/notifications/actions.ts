"use server"

import { auth } from "@/auth"
import { withRLS } from "@/db/rls"
import { notifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function markAsRead(notificationId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await withRLS(session.user.id, async (tx) => {
    await tx
      .update(notifications)
      .set({
        isRead: 1,
      })
      .where(eq(notifications.id, notificationId))
  })

  revalidatePath("/notifications")
}
