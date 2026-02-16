-- マイグレーション: summariesテーブルにis_publicカラムを追加

ALTER TABLE "summaries" ADD COLUMN "is_public" integer DEFAULT 0 NOT NULL;
