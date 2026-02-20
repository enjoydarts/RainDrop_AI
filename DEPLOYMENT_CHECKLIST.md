# デプロイ前チェックリスト

このチェックリストを使って、デプロイ前に必要な準備が完了しているか確認してください。

## コードの準備

- [ ] すべての変更をコミット済み
- [ ] テストが全て通る（`npm test`）
- [ ] Lintエラーなし（`npm run lint`）
- [ ] 型エラーなし（`npm run type-check`）
- [ ] `.env.local`がGitにコミットされていない（`.gitignore`で除外）
- [ ] `auth.ts.bak`などのバックアップファイルが除外されている

## Supabase のセットアップ

- [ ] Supabaseアカウント作成済み
- [ ] 新しいプロジェクトを作成済み
- [ ] Database URLを取得済み（`postgresql://...`）
- [ ] データベースマイグレーションを実行済み
  ```bash
  export DATABASE_URL="your-supabase-url"
  npm run db:push
  ```

## Inngest Cloud のセットアップ

- [ ] Inngest Cloudアカウント作成済み
- [ ] 新しいアプリを作成済み
- [ ] Event Keyを取得済み
- [ ] Signing Keyを取得済み

## Raindrop.io アプリ設定

- [ ] 本番用のOAuth Redirect URLを追加済み
  - 例: `https://your-app.vercel.app/api/auth/raindrop/callback`
- [ ] Client IDとClient Secretをメモ済み

## AI API

- [ ] Anthropic / OpenAI APIキーを取得済み
- [ ] ユーザーが `/settings` から登録する運用を周知済み

## Redis のセットアップ

- [ ] Upstash Redisアカウント作成済み（またはマネージドRedis）
- [ ] `REDIS_URL` を取得済み

## Ably のセットアップ

- [ ] Ablyアカウント作成済み
- [ ] `ABLY_API_KEY` / `NEXT_PUBLIC_ABLY_KEY` を取得済み

## 環境変数の準備

以下の環境変数を準備（Vercelで設定）：

### Next.js / Auth
- [ ] `NEXTAUTH_URL` - 本番URL（例: `https://your-app.vercel.app`）
- [ ] `NODE_ENV=production`
- [ ] `AUTH_SECRET` - 新規生成（`openssl rand -hex 32`）

### Raindrop.io OAuth
- [ ] `AUTH_RAINDROP_ID` - Raindrop Client ID
- [ ] `AUTH_RAINDROP_SECRET` - Raindrop Client Secret

### Database
- [ ] `DATABASE_URL` - Supabaseの接続文字列

### Inngest
- [ ] `INNGEST_EVENT_KEY` - Inngest Event Key
- [ ] `INNGEST_SIGNING_KEY` - Inngest Signing Key
- [ ] `INNGEST_DEV=0`
- [ ] `INNGEST_BASE_URL=https://inn.gs`

### Encryption
- [ ] `ENCRYPTION_KEY` - 新規生成（`openssl rand -hex 32`）

### Redis
- [ ] `REDIS_URL` - Upstash Redis URL

### Ably
- [ ] `ABLY_API_KEY` - Ably API Key
- [ ] `NEXT_PUBLIC_ABLY_KEY` - Ably Public Key

## Vercel デプロイ

- [ ] Vercelアカウント作成済み
- [ ] GitHubリポジトリをインポート済み
- [ ] 上記の環境変数をすべて設定済み
- [ ] デプロイが成功した（ビルドエラーなし）

## デプロイ後の確認

- [ ] デプロイされたURLにアクセスできる
- [ ] ログインページが表示される
- [ ] Raindrop.ioでログインできる
- [ ] ダッシュボードが表示される
- [ ] ダークモード切り替えが動作する
- [ ] `/settings` でAPIキーが登録できる
- [ ] ログアウトできる
- [ ] Vercelのログにエラーがない

## Inngest の接続

- [ ] Inngest CloudダッシュボードでアプリをSyncした
- [ ] App URLを設定済み（`https://your-app.vercel.app/api/inngest`）
- [ ] Inngestのテストイベントが動作する

## セキュリティ

- [ ] `AUTH_SECRET`は本番用に新しく生成した（開発環境と別）
- [ ] `ENCRYPTION_KEY`は本番用に新しく生成した（開発環境と別）
- [ ] Supabaseのデータベースパスワードは強力
- [ ] Raindrop.io OAuth credentialsは本番用アプリのもの
- [ ] 環境変数がGitにコミットされていない
- [ ] API Keyが公開されていない

## オプション

- [ ] カスタムドメインを設定（Vercel）
- [ ] DNS設定を完了（カスタムドメインの場合）
- [ ] SSL証明書が発行された（自動）
- [ ] モニタリング設定（Vercel Analytics、Sentry など）
- [ ] エラー通知設定

## トラブルシューティング

デプロイ後に問題が発生した場合：

1. **Vercelのログを確認**
   - Vercelダッシュボード → Deployments → 最新のデプロイ → Logs

2. **環境変数を再確認**
   - すべての環境変数が正しく設定されているか
   - 変更後は再デプロイが必要

3. **データベース接続を確認**
   - SupabaseのURLが正しいか
   - Vercelからの接続が許可されているか

4. **Inngestの接続を確認**
   - App URLが正しいか（`https://your-app.vercel.app/api/inngest`）
   - Event KeyとSigning Keyが正しいか

## 次のステップ

デプロイが成功したら：

- [ ] チームメンバーに本番URLを共有
- [ ] ドキュメントを更新（本番URLなど）
- [ ] モニタリングダッシュボードをセットアップ
- [ ] バックアップ戦略を検討
- [ ] 継続的デプロイのワークフローを確認

---

詳細な手順は [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) を参照してください。
