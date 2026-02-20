import { NextRequest, NextResponse } from "next/server"

// REDIS_URL が設定されている場合のみ ioredis + rate-limiter-flexible を使用
// ローカル: redis://redis:6379
// 本番(Upstash): rediss://username:password@host:6379
let limiter: {
  consume: (key: string, points?: number) => Promise<void>
} | null = null

if (process.env.REDIS_URL) {
  const Redis = require("ioredis")
  const { RateLimiterRedis } = require("rate-limiter-flexible")

  const redisClient = new Redis(process.env.REDIS_URL, {
    enableOfflineQueue: false,
    lazyConnect: true,
  })

  limiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "raindary:rl",
    points: 20,      // リクエスト数
    duration: 60,    // 秒（1分間のスライディングウィンドウ）
  })
}

/**
 * APIルートにレート制限を適用するヘルパー
 * REDIS_URLが設定されていない場合はスキップ（開発環境等）
 */
export async function checkRateLimit(
  _req: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  if (!limiter) {
    return null
  }

  try {
    await limiter.consume(`user:${userId}`)
    return null
  } catch {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }
}
