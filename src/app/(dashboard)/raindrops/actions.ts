"use server"

import { auth } from "@/auth"
import { inngest } from "@/inngest/client"
import { revalidatePath } from "next/cache"

export async function triggerImport() {
  console.log("[triggerImport] Function called")

  const session = await auth()
  console.log("[triggerImport] Session:", session?.user?.id ? "authenticated" : "not authenticated")

  if (!session?.user?.id) {
    console.error("[triggerImport] Unauthorized - no session")
    throw new Error("Unauthorized")
  }

  console.log("[triggerImport] Starting import for user:", session.user.id)

  // 環境変数の確認
  console.log("[triggerImport] Environment check:", {
    hasEventKey: !!process.env.INNGEST_EVENT_KEY,
    hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
    inngestDev: process.env.INNGEST_DEV,
  })

  try {
    // Inngestイベントを直接送信
    console.log("[triggerImport] Sending Inngest event...")
    const result = await inngest.send({
      name: "raindrop/import.requested",
      data: {
        userId: session.user.id,
      },
    })
    console.log("[triggerImport] Inngest event sent successfully:", JSON.stringify(result))
  } catch (error) {
    console.error("[triggerImport] Failed to send Inngest event:", error)
    console.error("[triggerImport] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw new Error(`Inngestイベント送信に失敗: ${error instanceof Error ? error.message : String(error)}`)
  }

  // ページをリフレッシュ
  revalidatePath("/raindrops")

  console.log("[triggerImport] Import triggered successfully")
  return { success: true }
}

export async function generateSummary(raindropId: number, tone: string = "neutral") {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // 本文抽出イベントを送信（まだ抽出されていない場合）
  await inngest.send({
    name: "raindrop/item.extract.requested",
    data: {
      userId: session.user.id,
      raindropId,
    },
  })

  // 要約生成イベントを送信
  await inngest.send({
    name: "raindrop/item.summarize.requested",
    data: {
      userId: session.user.id,
      raindropId,
      tone: tone as "snarky" | "neutral" | "enthusiastic" | "casual",
    },
  })

  // ページをリフレッシュ
  revalidatePath("/raindrops")
  revalidatePath("/summaries")
}
