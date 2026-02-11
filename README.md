# Raindrop AI - 自分語り要約

Raindrop.ioに保存した記事を自動で取り込み、AI要約で「読んだフリができる自分語り要約」を生成するツール

## 概要

技術記事を大量に保存するが読み切れないエンジニアのための、Claude APIを使った自動要約システム。
複数のトーン（毒舌、客観的、熱量高め、カジュアル）で要約を生成し、コストも可視化します。

## 技術スタック

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Auth.js v5 (Raindrop OAuth2)
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM
- **Queue**: Inngest
- **Extract**: Python + trafilatura
- **LLM**: Anthropic Claude
- **Deploy**: Vercel

## 主な機能

- ✅ Raindrop.io OAuth認証
- ✅ 記事の自動取り込み
- ✅ 本文抽出（trafilatura）
- ✅ 2段階AI要約（事実抽出 → 自分語り要約）
- ✅ 4種類のトーン対応
- ✅ マルチユーザー対応
- ✅ コスト追跡・可視化
- ✅ 手動・自動同期

## セットアップ

### 1. 環境変数の設定

```bash
# .env.local.exampleをコピー
cp .env.local.example .env.local

# 必要な環境変数を設定
# - AUTH_SECRET: openssl rand -hex 32
# - ENCRYPTION_KEY: openssl rand -hex 32
# - AUTH_RAINDROP_ID/SECRET: Raindrop.io App Management
# - ANTHROPIC_API_KEY: Anthropic Console
```

### 2. Docker Composeで起動

```bash
# 初回起動（ビルド含む）
docker compose up --build

# 通常起動
docker compose up

# バックグラウンド起動
docker compose up -d
```

### 3. アクセス

- **Next.js**: http://localhost:3000
- **Extract API**: http://localhost:8000
- **Inngest Dev Server**: http://localhost:8288
- **PostgreSQL**: localhost:5432

## 開発

### ローカル開発環境

Docker Compose環境が起動している状態で開発を進めます。

```bash
# ログを確認
docker compose logs -f web

# 特定のサービスを再起動
docker compose restart web

# 停止
docker compose down

# 完全削除（DBデータも削除）
docker compose down -v
```

### データベース

```bash
# マイグレーション生成
docker compose exec web npm run db:generate

# マイグレーション適用
docker compose exec web npm run db:push

# Drizzle Studio起動
docker compose exec web npm run db:studio
```

## ライセンス

MIT

## 作成者

@enjoydarts
