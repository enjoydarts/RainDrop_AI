import { Realtime } from "ably"

/**
 * Ablyサーバークライアント（Inngest関数から使用）
 */
let ablyClient: Realtime | null = null

export function getAblyClient() {
  if (!process.env.ABLY_API_KEY) {
    console.warn("[ably] ABLY_API_KEY not set, notifications disabled")
    return null
  }

  if (!ablyClient) {
    ablyClient = new Realtime({
      key: process.env.ABLY_API_KEY,
    })
  }

  return ablyClient
}

/**
 * ユーザーに通知を送信
 */
export async function notifyUser(
  userId: string,
  eventName: string,
  data: Record<string, any>
) {
  const client = getAblyClient()
  if (!client) {
    console.warn(`[ably] Skip notification: ${eventName}`)
    return
  }

  try {
    const channel = client.channels.get(`user:${userId}`)
    await channel.publish(eventName, data)
    console.log(`[ably] Notification sent: ${eventName} to user:${userId}`)
  } catch (error) {
    console.error(`[ably] Failed to send notification:`, error)
  }
}
