# 本番環境デプロイ手順

最新のコード（RLS対応）を本番環境にデプロイする手順です。

## 📋 前提条件

- ✅ すべての変更がGitHubにプッシュ済み
- ✅ Vercelプロジェクトが設定済み
- ✅ Supabaseプロジェクトが設定済み
- ✅ 環境変数がすべて設定済み

## 🚀 デプロイ手順

### ステップ1: Vercelデプロイの確認 ✅

GitHubへのプッシュにより、Vercelが自動的にデプロイを開始します。

**確認方法:**
1. Vercelダッシュボードにアクセス: https://vercel.com/dashboard
2. プロジェクトを選択
3. 「Deployments」タブで最新のデプロイを確認
4. ビルドログを確認:
   - ✅ `npm run build` が成功
   - ✅ TypeScriptエラーなし
   - ✅ デプロイ完了

**デプロイURL:** デプロイ完了後に表示される

### ステップ2: Supabaseで RLSマイグレーションを実行 ⚠️

**重要**: この手順は**必須**です。RLSを有効化しないと、セキュリティ上のリスクがあります。

#### 方法A: ローカルから実行（推奨）

```bash
# 1. Supabaseの接続文字列を環境変数に設定
export DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# 2. マイグレーションファイルを確認
cat src/db/migrations/0002_enable_rls.sql

# 3. Drizzleでマイグレーションを実行
npx drizzle-kit migrate

# または、PostgreSQLクライアントで直接実行
psql $DATABASE_URL -f src/db/migrations/0002_enable_rls.sql
```

**接続文字列の取得方法:**
1. Supabaseダッシュボード → Project Settings → Database
2. Connection string の「URI」タブを選択
3. パスワードを入力してコピー

#### 方法B: SupabaseダッシュボードのSQL Editorで実行

```bash
# 1. マイグレーションファイルの内容をコピー
cat src/db/migrations/0002_enable_rls.sql
```

次に:
1. Supabaseダッシュボード → SQL Editor
2. 「New query」をクリック
3. マイグレーションファイルの内容を貼り付け
4. 「Run」をクリック

**実行される内容:**
- すべてのテーブルでRLSを有効化
- ユーザーは自分のデータのみアクセス可能
- 公開要約（`is_public = 1`）は誰でも閲覧可能
- サービスロール用のポリシー設定

### ステップ3: RLS有効化の確認

SupabaseのSQL Editorで以下を実行して確認:

```sql
-- RLSが有効になっているか確認
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user', 'account', 'session', 'raindrops', 'summaries', 'api_usage');

-- 期待される結果: すべてのテーブルでrowsecurity = true
```

### ステップ4: 本番環境での動作確認

デプロイされたアプリにアクセスして、すべての機能をテスト:

**テスト項目:**
- [ ] ログイン（Raindrop.io OAuth）
- [ ] ダッシュボードの表示
- [ ] 記事一覧の表示
- [ ] 記事の取り込み（「今すぐ取り込む」ボタン）
- [ ] 要約の生成
- [ ] 要約一覧の表示
- [ ] 要約詳細ページの表示
- [ ] 統計ページの表示
- [ ] 公開要約の表示（/share/[id]）
- [ ] 要約の公開/非公開切り替え

### ステップ5: Inngest Cloudの接続確認

Inngestダッシュボードで、バックグラウンドジョブが正常に動作しているか確認:

1. Inngestダッシュボードにアクセス: https://app.inngest.com
2. アプリを選択
3. 「Functions」タブで3つの関数を確認:
   - ✅ `raindrop-import`
   - ✅ `raindrop-extract`
   - ✅ `raindrop-summarize`
4. テストとして記事を取り込み、実行ログを確認

### ステップ6: ログの監視

#### Vercelログ
- Vercel → Deployments → 最新のデプロイ → Logs
- エラーがないか確認

#### Supabaseログ
- Supabase → Logs → Database
- RLSポリシーによるアクセス制御が正常に動作しているか確認

#### Inngestログ
- Inngest → Functions → Runs
- バックグラウンドジョブが成功しているか確認

## 🔍 トラブルシューティング

### エラー: `permission denied for table xxx`

**原因**: RLSが有効になっているが、アプリコードが古い

**解決方法**:
1. Vercelで最新のコードがデプロイされているか確認
2. キャッシュをクリアして再デプロイ: Vercel → Deployments → 「...」→ Redeploy

### エラー: ログインできない

**原因**: Raindrop.io OAuth設定が間違っている

**解決方法**:
1. Raindrop.io → App Settings → Integrations
2. Redirect URIを確認: `https://your-app.vercel.app/api/auth/callback/raindrop`
3. 正確なURLに更新（HTTPSであることを確認）

### エラー: Inngest関数が実行されない

**原因**: Inngest Cloud接続設定が間違っている

**解決方法**:
1. Inngestダッシュボード → Settings → Apps → Sync App
2. App URLを確認: `https://your-app.vercel.app/api/inngest`
3. 「Sync」をクリック

### エラー: 公開要約が表示されない

**原因**: RLSポリシーで公開要約が取得できていない

**解決方法**:
1. SupabaseのSQL Editorで確認:
   ```sql
   SELECT id, is_public FROM summaries WHERE id = '<要約ID>';
   ```
2. `is_public = 1` になっているか確認
3. RLSポリシーが正しく設定されているか確認

## ✅ デプロイ完了チェックリスト

すべての項目を確認してチェックを付けてください:

- [ ] Vercelデプロイが成功
- [ ] SupabaseでRLSマイグレーションを実行
- [ ] RLSが有効になっていることを確認（SQL実行）
- [ ] ログイン動作確認
- [ ] 記事取り込み動作確認
- [ ] 要約生成動作確認
- [ ] 公開要約の表示確認
- [ ] Inngest関数の動作確認
- [ ] エラーログなし

## 🎉 デプロイ完了

すべてのチェックが完了したら、本番環境でRLS対応アプリが稼働しています！

**次のステップ:**
- 定期的にログを監視
- ユーザーからのフィードバックを収集
- パフォーマンスを監視（Vercel Analytics & Speed Insights）

## 📚 参考資料

- [RLS実装ガイド](./docs/RLS.md)
- [RLSマイグレーションガイド](./docs/RLS_MIGRATION_GUIDE.md)
- [デプロイガイド](./docs/DEPLOYMENT.md)
