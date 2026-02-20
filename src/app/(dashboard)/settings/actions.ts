"use server"

import { auth } from "@/auth"
import { withRLS } from "@/db/rls"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { encrypt } from "@/lib/crypto"

const ALLOWED_TONES = ["snarky", "neutral", "enthusiastic", "casual"] as const
type AllowedTone = (typeof ALLOWED_TONES)[number]
const ALLOWED_FACTS_MODELS = [
  "claude-haiku-4-5",
  "claude-sonnet-4-6",
  "claude-opus-4-6",
] as const
type AllowedFactsModel = (typeof ALLOWED_FACTS_MODELS)[number]
const ALLOWED_SUMMARY_MODELS = [
  "claude-haiku-4-5",
  "claude-sonnet-4-6",
  "claude-opus-4-6",
] as const
type AllowedSummaryModel = (typeof ALLOWED_SUMMARY_MODELS)[number]

interface SaveAccountSettingsInput {
  monthlyBudgetUsd: string
  defaultSummaryTone: string
  notificationsEnabled: boolean
  defaultImportCollectionId: string
  factsExtractionModel: string
  summaryGenerationModel: string
  anthropicApiKey: string
  openaiApiKey: string
  clearAnthropicApiKey: boolean
  clearOpenaiApiKey: boolean
}

export async function saveAccountSettings(input: SaveAccountSettingsInput) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id
  const monthlyBudgetNumber = Number(input.monthlyBudgetUsd)
  const monthlyBudgetUsd =
    Number.isFinite(monthlyBudgetNumber) && monthlyBudgetNumber > 0
      ? monthlyBudgetNumber.toFixed(2)
      : null

  const defaultSummaryTone = ALLOWED_TONES.includes(
    input.defaultSummaryTone as AllowedTone
  )
    ? (input.defaultSummaryTone as AllowedTone)
    : "neutral"
  const factsExtractionModel = ALLOWED_FACTS_MODELS.includes(
    input.factsExtractionModel as AllowedFactsModel
  )
    ? (input.factsExtractionModel as AllowedFactsModel)
    : "claude-haiku-4-5"
  const summaryGenerationModel = ALLOWED_SUMMARY_MODELS.includes(
    input.summaryGenerationModel as AllowedSummaryModel
  )
    ? (input.summaryGenerationModel as AllowedSummaryModel)
    : "claude-sonnet-4-6"

  const collectionIdNumber = Number(input.defaultImportCollectionId)
  const defaultImportCollectionId =
    Number.isFinite(collectionIdNumber) && collectionIdNumber > 0
      ? Math.trunc(collectionIdNumber)
      : null

  const anthropicApiKey =
    input.clearAnthropicApiKey
      ? null
      : input.anthropicApiKey.trim()
        ? encrypt(input.anthropicApiKey.trim())
        : undefined

  const openaiApiKey =
    input.clearOpenaiApiKey
      ? null
      : input.openaiApiKey.trim()
        ? encrypt(input.openaiApiKey.trim())
        : undefined

  const apiKeyUpdate: Record<string, string | null | undefined> = {
    anthropicApiKeyEncrypted: anthropicApiKey,
    openaiApiKeyEncrypted: openaiApiKey,
  }

  await withRLS(userId, async (tx) => {
    await tx
      .update(users)
      .set({
        monthlyBudgetUsd,
        defaultSummaryTone,
        factsExtractionModel,
        summaryGenerationModel,
        notificationsEnabled: input.notificationsEnabled ? 1 : 0,
        defaultImportCollectionId,
        ...apiKeyUpdate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
  })

  revalidatePath("/settings")
  revalidatePath("/dashboard")
  revalidatePath("/stats")
}
