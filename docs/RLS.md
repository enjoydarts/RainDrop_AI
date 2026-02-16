# Row Level Security (RLS) 実装ガイド

PostgreSQLの Row Level Security (RLS) を使って、データベースレベルでアクセス制御を実現します。

## 概要

RLSを有効にすることで、以下のメリットがあります：

1. **セキュリティの強化**: データベースレベルでアクセス制御（アプリケーションコードのバグがあっても安全）
2. **コードの簡潔化**: アプリケーションコードでのユーザーIDフィルタリングが不要
3. **監査の容易化**: すべてのデータアクセスがPostgreSQLログに記録

## アーキテクチャ

```
┌─────────────────────────────────────┐
│  Next.js App (auth session)         │
│  ↓ userId を取得                    │
└─────────────────┬───────────────────┘
                  │
                  ↓
┌─────────────────────────────────────┐
│  RLS Helper (src/db/rls.ts)         │
│  SET LOCAL app.current_user_id      │
│  ↓ セッション変数を設定              │
└─────────────────┬───────────────────┘
                  │
                  ↓
┌─────────────────────────────────────┐
│  PostgreSQL (Supabase)              │
│  ↓ RLSポリシーでアクセス制御        │
│  ✓ current_user_id == user_id       │
└─────────────────────────────────────┘
```

## 使い方

### 1. 認証済みユーザーのクエリ

```typescript
import { withRLS } from "@/db/rls"
import { raindrops } from "@/db/schema"
import { isNull, desc } from "drizzle-orm"

// Server ComponentまたはServer Action内
const session = await auth()
const userId = session.user.id

// RLSでユーザーのデータのみ取得
const items = await withRLS(userId, async (tx) => {
  return await tx
    .select()
    .from(raindrops)
    .where(isNull(raindrops.deletedAt))
    .orderBy(desc(raindrops.syncedAt))
    .limit(50)
})
```

### 2. 匿名ユーザー（公開データのみ）

```typescript
import { withAnonymous } from "@/db/rls"
import { summaries, raindrops } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// 公開されている要約のみ取得
const [summary] = await withAnonymous(async (tx) => {
  return await tx
    .select()
    .from(summaries)
    .innerJoin(raindrops, eq(summaries.raindropId, raindrops.id))
    .where(and(eq(summaries.id, id), eq(summaries.isPublic, 1)))
    .limit(1)
})
```

### 3. サービスロール（バックグラウンドジョブ）

```typescript
import { withServiceRole } from "@/db/rls"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

// Inngest関数など、信頼できるサービス内で使用
export const raindropImport = inngest.createFunction(
  { id: "raindrop-import" },
  { event: "raindrop/import.requested" },
  async ({ event, step }) => {
    const { userId } = event.data

    // サービスロール権限で全ユーザーのデータにアクセス可能
    const user = await step.run("fetch-user", async () => {
      return await withServiceRole(async (tx) => {
        const [userRecord] = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        return userRecord
      })
    })

    // ...
  }
)
```

## RLSポリシー

### Users テーブル

- **読み取り**: 自分のユーザー情報のみ
- **更新**: 自分のユーザー情報のみ

```sql
CREATE POLICY "Users can view own data"
  ON "user"
  FOR SELECT
  USING (id = auth.current_user_id());
```

### Raindrops テーブル

- **読み取り**: 自分の記事のみ
- **挿入**: 自分の記事のみ
- **更新**: 自分の記事のみ

```sql
CREATE POLICY "Users can view own raindrops"
  ON "raindrops"
  FOR SELECT
  USING ("user_id" = auth.current_user_id());
```

### Summaries テーブル

- **読み取り**: 自分の要約、**または公開されている要約**
- **挿入**: 自分の要約のみ
- **更新**: 自分の要約のみ

```sql
CREATE POLICY "Users can view own or public summaries"
  ON "summaries"
  FOR SELECT
  USING (
    "user_id" = auth.current_user_id()
    OR "is_public" = 1
  );
```

## マイグレーション

RLSを有効にするマイグレーションは `src/db/migrations/0002_enable_rls.sql` に定義されています。

### 本番環境での有効化

```bash
# Supabaseにデプロイ済みの場合
npm run db:migrate
```

### ローカル環境での有効化

```bash
# Docker環境
docker compose exec web npm run db:migrate
```

## トラブルシューティング

### RLSポリシーでクエリが失敗する

**症状**: `permission denied for table xxx`

**原因**: `app.current_user_id` セッション変数が設定されていない

**解決**: すべてのクエリを `withRLS()`, `withAnonymous()`, または `withServiceRole()` でラップする

### サービスロールでアクセスできない

**症状**: バックグラウンドジョブでデータが取得できない

**原因**: `withServiceRole()` を使っていない

**解決**: Inngest関数などのサービスでは `withServiceRole()` を使用

### 公開要約が表示されない

**症状**: `/share/[id]` で404エラー

**原因**: 匿名アクセスで `withAnonymous()` を使っていない

**解決**:
```typescript
// ❌ NG: 通常のdbを使うとRLSで拒否される
const summary = await db.select().from(summaries).where(...)

// ✅ OK: withAnonymousを使う
const summary = await withAnonymous(async (tx) => {
  return await tx.select().from(summaries).where(...)
})
```

## ベストプラクティス

### 1. すべてのクエリをラップする

```typescript
// ❌ NG: 生のdbを使う（RLSが適用されない）
const items = await db.select().from(raindrops)

// ✅ OK: withRLSでラップ
const items = await withRLS(userId, async (tx) => {
  return await tx.select().from(raindrops)
})
```

### 2. WHERE句は簡潔に

RLSが自動的にユーザーIDでフィルタリングするため、アプリケーションコードでの明示的なフィルタリングは不要：

```typescript
// RLS無効時（従来）
const items = await db
  .select()
  .from(raindrops)
  .where(eq(raindrops.userId, userId)) // 明示的フィルタリング

// RLS有効時
const items = await withRLS(userId, async (tx) => {
  return await tx
    .select()
    .from(raindrops)
    // .where(eq(raindrops.userId, userId)) ← 不要！
})
```

### 3. トランザクション内で複数クエリ

```typescript
const { items, user } = await withRLS(userId, async (tx) => {
  // 同じトランザクション内で複数クエリを実行
  const items = await tx.select().from(raindrops).limit(50)
  const [user] = await tx.select().from(users).limit(1)

  return { items, user }
})
```

## セキュリティ考慮事項

1. **サービスロールの使用は慎重に**: `withServiceRole()` はRLSをバイパスするため、信頼できるコードでのみ使用

2. **公開データの明示**: 公開要約など、匿名アクセス可能なデータは `is_public = 1` を必ず設定

3. **セッション変数の保護**: `app.current_user_id` は各リクエストごとにトランザクション内でのみ有効（別ユーザーに影響なし）

4. **監査ログ**: PostgreSQLのクエリログでRLS適用状況を監視可能

## 参考資料

- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Drizzle ORM Transactions](https://orm.drizzle.team/docs/transactions)
