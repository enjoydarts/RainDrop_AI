-- Row Level Security (RLS) ポリシーを有効化

-- usersテーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_policy"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- raindropsテーブル
ALTER TABLE raindrops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "raindrops_select_policy"
  ON raindrops
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "raindrops_insert_policy"
  ON raindrops
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "raindrops_update_policy"
  ON raindrops
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "raindrops_delete_policy"
  ON raindrops
  FOR DELETE
  USING (auth.uid() = user_id);

-- summariesテーブル
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "summaries_select_policy"
  ON summaries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "summaries_insert_policy"
  ON summaries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "summaries_update_policy"
  ON summaries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "summaries_delete_policy"
  ON summaries
  FOR DELETE
  USING (auth.uid() = user_id);

-- api_usageテーブル
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_usage_select_policy"
  ON api_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "api_usage_insert_policy"
  ON api_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
