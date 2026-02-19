"use server"

import { signOut } from "@/auth"
import { auth } from "@/auth"
import { withRLS } from "@/db/rls"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function handleSignOut() {
  await signOut()
}

export async function setMonthlyBudgetUsd(value: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id
  const numericValue = Number(value)
  const budget = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null

  await withRLS(userId, async (tx) => {
    await tx
      .update(users)
      .set({
        monthlyBudgetUsd: budget ? budget.toFixed(2) : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
  })

  revalidatePath("/dashboard")
  revalidatePath("/stats")
}
