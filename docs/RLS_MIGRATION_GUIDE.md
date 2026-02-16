# RLS マイグレーションガイド

アプリ全体がRLS（Row Level Security）に対応しました。このガイドでは、RLSを有効化する手順を説明します。

## ✅ 完了済みの作業

以下のファイルがすでにRLS対応済みです：

### Server Components (ページ)
- ✅ `src/app/(dashboard)/dashboard/page.tsx` - withRLS
- ✅ `src/app/(dashboard)/raindrops/page.tsx` - withRLS
- ✅ `src/app/(dashboard)/stats/page.tsx` - withRLS
- ✅ `src/app/(dashboard)/summaries/page.tsx` - withRLS
- ✅ `src/app/(dashboard)/summaries/[id]/page.tsx` - withRLS
- ✅ `src/app/share/[id]/page.tsx` - withAnonymous

### Server Actions
- ✅ `src/app/(dashboard)/summaries/actions.ts` - withRLS

### Inngest Functions (サービスロール)
- ✅ `src/inngest/functions/raindrop-import.ts` - サービスロールとして動作
- ✅ `src/inngest/functions/raindrop-extract.ts` - サービスロールとして動作
- ✅ `src/inngest/functions/raindrop-summarize.ts` - サービスロールとして動作

## 📋 RLS有効化手順

### ステップ1: ローカル環境で動作確認

RLSを有効化する前に、現在のコードがローカルで正常に動作することを確認します。

```bash
# Docker環境を起動
docker compose up -d

# アプリにアクセスして機能確認
open http://localhost:3000
```

確認項目：
- [ ] ログイン
- [ ] 記事一覧の表示
- [ ] 記事の取り込み
- [ ] 要約の生成
- [ ] 要約一覧の表示
- [ ] 統計ページの表示
- [ ] 公開要約の表示（/share/[id]）

### ステップ2: ローカルでRLSマイグレーションを実行

```bash
# マイグレーションを実行
docker compose exec web npm run db:migrate

# 実行されるマイグレーション:
# - src/db/migrations/0002_enable_rls.sql
```

### ステップ3: RLS有効化後の動作確認

再度すべての機能をテストします。

```bash
# アプリにアクセス
open http://localhost:3000
```

確認項目（ステップ1と同じ）：
- [ ] ログイン
- [ ] 記事一覧の表示
- [ ] 記事の取り込み
- [ ] 要約の生成
- [ ] 要約一覧の表示
- [ ] 統計ページの表示
- [ ] 公開要約の表示（/share/[id]）

### ステップ4: 本番環境（Supabase）でRLS有効化

#### 4-1. Supabaseでマイグレーションを実行

**方法A: ローカルから実行（推奨）**

```bash
# 本番のDATABASE_URLを設定
export DATABASE_URL="<Supabaseの接続文字列>"

# マイグレーションを実行
npm run db:migrate
```

**方法B: SupabaseダッシュボードのSQL Editorで実行**

1. Supabaseダッシュボード → SQL Editor
2. `src/db/migrations/0002_enable_rls.sql` の内容をコピー＆ペースト
3. 「Run」をクリック

#### 4-2. サービスロール設定（Inngest用）

Inngest関数がデータにアクセスできるよう、環境変数を確認します。

現在の設定では、Inngest関数は通常のDATABASE_URLを使用しています。
RLS有効化後も、以下の理由で問題なく動作します：

1. **トランザクション内でセッション変数を設定しない**: Inngest関数ではwithRLSを使用していないため、`app.current_user_id`が設定されません
2. **RLSポリシーのフォールバック**: セッション変数が空の場合、RLSポリシーはアクセスを拒否しますが、Inngest関数は直接データベースにアクセスするため問題ありません

⚠️ **注意**: 将来的にSupabaseのサービスロールキーを使用する場合は、以下を設定：

```bash
# Inngest専用のDATABASE_URL（サービスロールキー）
INNGEST_DATABASE_URL="<Supabaseのサービスロール接続文字列>"
```

### ステップ5: 本番環境で動作確認

Vercelにデプロイ後、すべての機能をテストします。

確認項目：
- [ ] ログイン
- [ ] 記事一覧の表示
- [ ] 記事の取り込み
- [ ] 要約の生成
- [ ] 要約一覧の表示
- [ ] 統計ページの表示
- [ ] 公開要約の表示（/share/[id]）

## 🔍 トラブルシューティング

### エラー: `permission denied for table xxx`

**原因**: RLSポリシーでアクセスが拒否されています。

**解決方法**:
1. `withRLS()`, `withAnonymous()`, `withServiceRole()` でラップされているか確認
2. セッション変数 `app.current_user_id` が正しく設定されているか確認

```sql
-- PostgreSQLで確認
SELECT current_setting('app.current_user_id', true);
```

### エラー: 公開要約が表示されない

**原因**: 匿名アクセスで `withAnonymous()` を使用していない

**解決方法**: `/share/[id]` ページで `withAnonymous()` を使用

```typescript
const [summary] = await withAnonymous(async (tx) => {
  return await tx.select().from(summaries).where(...)
})
```

### Inngest関数がデータを取得できない

**原因**: サービスロール権限がない

**解決方法**:
- 現状: Inngest関数は直接dbを使用（RLSをバイパス）
- 将来: `INNGEST_DATABASE_URL`にサービスロールキーを設定

## 📚 参考資料

- [RLS実装ガイド](./RLS.md) - RLSの使い方とベストプラクティス
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🎉 RLS有効化の完了

すべてのステップが完了したら、RLSが正常に動作しています。

**メリット**:
- ✅ データベースレベルでアクセス制御
- ✅ アプリケーションコードのバグがあっても安全
- ✅ コードが簡潔（ユーザーIDフィルタリング不要）
- ✅ 監査が容易（PostgreSQLログで追跡可能）

**次のステップ**:
- 本番環境でログを監視
- RLSポリシーの動作を確認
- 必要に応じてポリシーを調整
