#!/usr/bin/env tsx
/**
 * マイグレーション実行スクリプト
 * Usage: npm run db:migrate:run
 */
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

async function main() {
  // ビルド時はPOOLER接続を優先、なければDIRECT接続
  const connectionString = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL or DATABASE_URL_POOLER is not set")
  }

  console.log("[migrate] Connecting to database...")

  // マイグレーション用の接続（max 1, RLSは不要）
  const migrationClient = postgres(connectionString, { max: 1 })
  const db = drizzle(migrationClient)

  console.log("[migrate] Running migrations...")
  await migrate(db, { migrationsFolder: "./src/db/migrations" })

  console.log("[migrate] Migrations completed successfully!")
  await migrationClient.end()
  process.exit(0)
}

main().catch((err) => {
  console.error("[migrate] Migration failed:", err)
  process.exit(1)
})
