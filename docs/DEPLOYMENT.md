# 本番環境デプロイガイド

このドキュメントでは、Raindaryアプリを本番環境にデプロイする手順を説明します。

## アーキテクチャ

本番環境では以下の無料プランを使用します：

- **Next.jsアプリ**: Vercel (無料)
- **データベース**: Supabase PostgreSQL (無料)
- **バックグラウンドジョブ**: Inngest Cloud (無料)
- **Extract Service**: Render (無料)

## 必要な前提条件

- GitHubアカウント
- 各サービスのアカウント（Supabase、Inngest、Render、Vercel）
- Raindrop.io OAuthアプリ（開発環境で作成済み）
- Anthropic Claude API キー

## デプロイ手順

以下の順序で作業を進めてください：

### ステップ1: Supabase のセットアップ

#### 1.1 プロジェクト作成

1. [supabase.com](https://supabase.com) でアカウント作成
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - **Project name**: `raindary`
   - **Database Password**: 強力なパスワードを生成（**必ず保存**）
   - **Region**: `Tokyo` または最寄りのリージョン
   - **Plan**: Free（無料）

#### 1.2 データベース接続情報の取得

1. プロジェクトダッシュボードで「Settings」→「Database」
2. 「Connection string」セクションで「URI」を選択
3. 接続文字列をコピー（形式: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`）
4. `[PASSWORD]`を実際のパスワードに置き換える

#### 1.3 データベースマイグレーション

ローカル環境からSupabaseにマイグレーションを実行：

```bash
# DATABASE_URLを一時的に設定
export DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"

# マイグレーション実行
npm run db:migrate
```

**確認**: Supabaseダッシュボードの「Table Editor」でテーブル（users, accounts, sessions, raindrop_items, summaries）が作成されていることを確認してください。

---

### ステップ2: Inngest Cloud のセットアップ

#### 2.1 アカウント作成

1. [inngest.com](https://www.inngest.com) でアカウント作成
2. 「Create App」をクリック
3. アプリ名を入力（例: `raindary`）

#### 2.2 キーの取得

1. ダッシュボードで「Settings」→「Keys」
2. 以下をコピー（後で使用）：
   - **Event Key**: イベント送信用
   - **Signing Key**: Webhook検証用

**注意**: この時点では App URL の設定は不要です（Vercelデプロイ後に設定します）。

---

### ステップ3: Render のセットアップ

#### 3.1 アカウント作成

1. [render.com](https://render.com) でアカウント作成（GitHub OAuthを推奨）
2. ダッシュボードにアクセス

#### 3.2 GitHubリポジトリの準備

まず、`render.yaml`をGitHubにpushします：

```bash
git add .
git commit -m "Add production deployment configuration"
git push origin main
```

#### 3.3 Blueprint からデプロイ

1. Renderダッシュボードで「New」→「Blueprint」
2. GitHubリポジトリを連携（初回のみ）
3. リポジトリを選択: `RainDrop_AI`
4. `render.yaml`が自動的に検出される
5. 「Apply」をクリック
6. デプロイが開始される（5-10分程度）

#### 3.4 デプロイ確認

1. デプロイ完了後、URLが表示される（例: `https://raindary-extract.onrender.com`）
2. URLをコピー（後で使用）
3. ヘルスチェックを確認:
   ```bash
   curl https://raindary-extract.onrender.com/health
   ```
   レスポンス: `{"status":"ok"}`

**重要な注意点**:
- Renderの無料プランでは、**15分間アクセスがないとサービスがスリープ**します
- スリープからの起動には30-60秒かかります
- Inngestのリトライ設定（既に実装済み）で自動的に対処されます

---

### ステップ4: Raindrop.io OAuth設定の更新

1. [Raindrop.io App Management Console](https://app.raindrop.io/settings/integrations) を開く
2. 既存のアプリを選択
3. Redirect URIに**仮URL**を追加:
   ```
   https://your-app.vercel.app/api/auth/callback/raindrop
   ```
   （Vercelデプロイ後に正確なURLに更新します）

---

### ステップ5: 環境変数の準備

以下の環境変数をテキストエディタやメモ帳に準備してください（Vercelで使用します）：

```bash
# Next.js / Auth.js
NEXTAUTH_URL=https://<your-app>.vercel.app  # デプロイ後に正確なURLに更新
NODE_ENV=production
AUTH_SECRET=<openssl rand -hex 32で新規生成>

# Raindrop.io OAuth
AUTH_RAINDROP_ID=<既存のClient ID>
AUTH_RAINDROP_SECRET=<既存のClient Secret>

# Database (Supabase)
DATABASE_URL=<ステップ1.2で取得した接続文字列>

# Inngest
INNGEST_EVENT_KEY=<ステップ2.2で取得したEvent Key>
INNGEST_SIGNING_KEY=<ステップ2.2で取得したSigning Key>
INNGEST_DEV=0
INNGEST_BASE_URL=https://inn.gs

# Anthropic
ANTHROPIC_API_KEY=<Claude API Key>

# Encryption
ENCRYPTION_KEY=<openssl rand -hex 32で新規生成>

# Extract Service (Render)
EXTRACT_API_URL=<ステップ3.4で取得したURL>/extract
```

**重要**: `AUTH_SECRET`と`ENCRYPTION_KEY`は本番用に新規生成してください（開発環境と別にする）：

```bash
# AUTH_SECRET生成
openssl rand -hex 32

# ENCRYPTION_KEY生成
openssl rand -hex 32
```

---

### ステップ6: Vercel デプロイ

#### 6.1 Vercelプロジェクト作成

1. [vercel.com](https://vercel.com) でアカウント作成/ログイン（GitHub OAuthを推奨）
2. 「Add New」→「Project」
3. GitHubリポジトリをインポート: `RainDrop_AI`
4. プロジェクト設定:
   - **Framework Preset**: Next.js（自動検出）
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `npm run build`（デフォルト）
   - **Install Command**: `npm install`（デフォルト）

#### 6.2 環境変数の設定

「Environment Variables」セクションで、ステップ5で準備した環境変数をすべて追加します：

1. 各環境変数をコピー&ペースト
2. **Production**、**Preview**、**Development** すべてにチェックを入れる
3. 「Add」をクリック

#### 6.3 デプロイ実行

1. 「Deploy」ボタンをクリック
2. ビルドが開始される（5-10分程度）
3. ビルドログで以下を確認:
   ```
   Running "npm run build"
   > npm run db:migrate && next build
   ```
4. デプロイ完了後、URLが表示される（例: `https://raindary-abc123.vercel.app`）

#### 6.4 環境変数の更新

1. Vercelダッシュボードで「Settings」→「Environment Variables」
2. `NEXTAUTH_URL`を見つけて「Edit」
3. 正確なURLに更新（例: `https://raindary-abc123.vercel.app`）
4. 「Save」
5. 「Deployments」→ 最新のデプロイ → 「Redeploy」

---

### ステップ7: Inngest 接続

1. Inngest Cloudダッシュボードに戻る
2. 「Apps」→ あなたのアプリを選択
3. 「Settings」→「Apps」→「Sync App」
4. App URLを入力: `https://<your-app>.vercel.app/api/inngest`
5. 「Save」→「Sync」をクリック
6. 「Functions」タブで以下の3つの関数が表示されることを確認:
   - `raindrop-import`
   - `raindrop-extract`
   - `raindrop-summarize`

---

### ステップ8: Raindrop.io 最終設定

1. [Raindrop.io App Management Console](https://app.raindrop.io/settings/integrations) に戻る
2. Redirect URIを正確なURLに更新:
   ```
   https://<your-app>.vercel.app/api/auth/callback/raindrop
   ```
3. 「Save」

---

## 動作確認

### エンドツーエンドテスト

1. **ログイン**:
   - デプロイされたURL（`https://<your-app>.vercel.app`）にアクセス
   - ログインページが表示されることを確認
   - 「Raindrop.ioでログイン」をクリック
   - Raindrop.ioで認証
   - ダッシュボードが表示されることを確認

2. **記事取り込み**:
   - ダッシュボードで「記事を取り込む」ボタンをクリック
   - Inngestダッシュボードで`raindrop-import`関数の実行を確認
   - 「Raindrops」ページで取り込まれた記事が表示されることを確認

3. **要約生成**:
   - 記事一覧で「要約を生成」ボタンをクリック
   - Inngestダッシュボードで`raindrop-extract`と`raindrop-summarize`の実行を確認
   - 「Summaries」ページで生成された要約が表示されることを確認

### エラーログの確認

エラーが発生した場合、以下のログを確認してください：

- **Vercel**: Deployments → 最新のデプロイ → 「Logs」（ビルドログ、実行時ログ）
- **Render**: Web Service → 「Logs」（Dockerビルド、uvicornログ）
- **Inngest**: Functions → Runs → 各関数の実行ログ

---

## トラブルシューティング

### よくあるエラー

#### 1. `redirect_uri_mismatch`

**原因**: Raindrop.io OAuthのRedirect URIが正しくない

**解決方法**:
1. Raindrop.io App Consoleで Redirect URI を確認
2. Vercelの`NEXTAUTH_URL`と一致しているか確認
3. 両方とも`https://<your-app>.vercel.app/api/auth/callback/raindrop`になっているか確認

#### 2. `DATABASE_URL environment variable is not set`

**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. Vercelダッシュボード → Settings → Environment Variables
2. `DATABASE_URL`が設定されているか確認
3. Production、Preview、Development にチェックが入っているか確認
4. 再デプロイ（Deployments → Redeploy）

#### 3. Extract Service タイムアウト

**原因**: Renderがスリープ状態

**解決方法**:
- Inngestのリトライ設定で自動的に解決されます（2回リトライ）
- 2回目のリトライでも失敗する場合:
  1. Renderダッシュボード → Web Service → Logs を確認
  2. サービスが正常に起動しているか確認
  3. ヘルスチェックが成功しているか確認

#### 4. 画像が表示されない

**原因**: Vercel無料プランの画像最適化制限（月1,000回）を超えた

**解決方法**:
1. `next.config.ts`を編集:
   ```typescript
   const nextConfig: NextConfig = {
     images: {
       remotePatterns: [
         {
           protocol: "https",
           hostname: "**",
         },
         {
           protocol: "http",
           hostname: "**",
         },
       ],
       unoptimized: true, // 画像最適化を無効化
     },
   }
   ```
2. Gitにコミット&プッシュして再デプロイ

#### 5. ビルド時にマイグレーションエラー

**原因**: `DATABASE_URL`が正しくない、またはネットワークエラー

**解決方法**:
1. Supabaseの接続文字列を再確認
2. パスワードが正しくエスケープされているか確認（特殊文字が含まれる場合）
3. 手動でマイグレーションを実行:
   ```bash
   export DATABASE_URL="<Supabase URL>"
   npm run db:migrate
   ```

#### 6. Inngestイベントが動作しない

**原因**: Inngest Cloudとの同期が失敗している

**解決方法**:
1. Inngestダッシュボード → Apps → Sync App
2. App URLが正しいか確認（`https://<your-app>.vercel.app/api/inngest`）
3. `INNGEST_SIGNING_KEY`が正しいか確認
4. Vercelの環境変数で`INNGEST_DEV=0`になっているか確認
5. 再同期（Sync ボタンをクリック）

---

## 無料プランの制限事項

### Vercel (無料)
- **ビルド時間**: 6,000分/月
- **帯域幅**: 100GB/月
- **画像最適化**: 1,000回/月
- **関数実行時間**: 10秒（Hobbyプラン）
- **関数メモリ**: 1024MB

### Supabase (無料)
- **データベース**: 500MB
- **帯域幅**: 5GB/月
- **API リクエスト**: 無制限（レート制限あり）

### Inngest Cloud (無料)
- **実行回数**: 25,000回/月
- **同時実行**: 5並列
- **ログ保持**: 7日間

### Render (無料)
- **15分間アクセスなしでスリープ**
- **月750時間の実行時間**（複数サービスで共有）
- **起動時間**: 30-60秒

### Anthropic Claude API (従量課金)
- **記事1件あたりのコスト**: 約$0.02-0.05（Claude 3.5 Sonnet使用時）
- **月100記事**: 約$2-5

---

## 継続的デプロイ

`main`ブランチにpushすると、Vercelが自動的にデプロイします：

```bash
git add .
git commit -m "Add new feature"
git push origin main
```

プレビューデプロイ（プルリクエスト用）も自動的に作成されます。

---

## カスタムドメインの設定（オプション）

1. Vercelダッシュボードで「Settings」→「Domains」
2. カスタムドメインを追加
3. DNSレコードを設定（VercelがCNAMEレコードを表示）
4. SSL証明書が自動的に発行される（Let's Encrypt）
5. `NEXTAUTH_URL`を新しいドメインに更新して再デプロイ

---

## セキュリティチェックリスト

デプロイ前に以下を確認してください：

- [ ] `AUTH_SECRET`は本番用に新しく生成した（開発環境と別）
- [ ] `ENCRYPTION_KEY`は本番用に新しく生成した（開発環境と別）
- [ ] Raindrop.io OAuth credentials は本番用アプリのもの
- [ ] すべての環境変数が正しく設定されている
- [ ] Supabaseのデータベースパスワードは強力（最低16文字）
- [ ] `.env.local`はGitにコミットされていない（.gitignoreで除外済み）
- [ ] Raindrop.io Redirect URIは本番URLに設定されている

---

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Inngest Documentation](https://www.inngest.com/docs)
- [Render Documentation](https://render.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Auth.js (NextAuth) Documentation](https://authjs.dev)
- [Anthropic Claude API Documentation](https://docs.anthropic.com)

---

## サポート

問題が解決しない場合:
1. GitHubリポジトリのIssuesで報告
2. 各サービスの公式ドキュメントを参照
3. 各サービスのコミュニティフォーラムで質問
