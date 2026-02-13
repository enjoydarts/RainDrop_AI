-- Add deleted_at column to summaries table for soft delete
ALTER TABLE "summaries" ADD COLUMN "deleted_at" timestamp with time zone;
