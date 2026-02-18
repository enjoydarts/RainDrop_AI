import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

/**
 * PostgreSQL接続
 */
const connectionString = process.env.DATABASE_URL

// クエリクライアント（マイグレーション用）
export const migrationClient = postgres(connectionString, { max: 1 })

// 通常のクライアント
// Serverless環境（Vercel + Supabase/Neon）でのコネクション管理を最適化
// 注: 本番環境では必ずPooled Connection String（:6543ポート）を使用してください
const queryClient = postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 1 : 10, // 本番環境では1接続、開発環境では10接続
  idle_timeout: 10, // アイドル接続を10秒でクローズ
  connect_timeout: 10, // 接続タイムアウト
  prepare: false, // Serverless環境では prepared statements を無効化
})

/**
 * Drizzle ORM インスタンス
 */
export const db = drizzle(queryClient, { schema })

/**
 * スキーマとテーブルをエクスポート
 */
export { schema }
export * from "./schema"
