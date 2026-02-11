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
const queryClient = postgres(connectionString)

/**
 * Drizzle ORM インスタンス
 */
export const db = drizzle(queryClient, { schema })

/**
 * スキーマとテーブルをエクスポート
 */
export { schema }
export * from "./schema"
