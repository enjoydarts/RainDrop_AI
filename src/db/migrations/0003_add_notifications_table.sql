-- 通知テーブルの作成
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"data" jsonb,
	"is_read" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

-- 外部キー制約
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

-- インデックス
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" ("created_at");

-- RLS有効化
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分の通知のみアクセス可能
CREATE POLICY "users_read_own_notifications" ON "notifications"
FOR SELECT
USING (user_id = current_setting('app.current_user_id', true)::text);

CREATE POLICY "users_update_own_notifications" ON "notifications"
FOR UPDATE
USING (user_id = current_setting('app.current_user_id', true)::text);

CREATE POLICY "users_delete_own_notifications" ON "notifications"
FOR DELETE
USING (user_id = current_setting('app.current_user_id', true)::text);
