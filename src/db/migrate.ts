/**
 * アプリケーション起動時のマイグレーション
 */
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

let migrated = false

export async function runMigrations() {
  // 既にマイグレーション済みの場合はスキップ
  if (migrated) {
    return
  }

  // 本番環境でのみマイグレーションを実行
  if (process.env.NODE_ENV !== "production") {
    console.log("[migrate] Skipping migrations in development")
    return
  }

  const connectionString = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL

  if (!connectionString) {
    console.error("[migrate] DATABASE_URL is not set, skipping migrations")
    return
  }

  try {
    console.log("[migrate] Running migrations...")
    const migrationClient = postgres(connectionString, { max: 1 })
    const db = drizzle(migrationClient)

    await migrate(db, { migrationsFolder: "./src/db/migrations" })
    await migrationClient.end()

    migrated = true
    console.log("[migrate] Migrations completed successfully")
  } catch (error) {
    console.error("[migrate] Migration failed:", error)
    // エラーでもアプリケーションは起動させる
  }
}
