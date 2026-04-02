-- AI 해설 크레딧
CREATE TABLE user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_credits integer NOT NULL DEFAULT 1,
  used_credits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_credits_user_id_unique UNIQUE (user_id),
  CONSTRAINT used_not_exceed_total CHECK (used_credits <= total_credits)
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
  ON user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON user_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- AI 해설 저장
CREATE TABLE ai_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_hash text NOT NULL,
  explanation text NOT NULL,
  share_id text REFERENCES shared_results(share_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_explanations_user_input_unique UNIQUE (user_id, input_hash)
);

CREATE INDEX idx_ai_explanations_user_id ON ai_explanations(user_id);
CREATE INDEX idx_ai_explanations_share_id ON ai_explanations(share_id);

ALTER TABLE ai_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own explanations"
  ON ai_explanations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own explanations"
  ON ai_explanations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own explanations"
  ON ai_explanations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read shared explanations"
  ON ai_explanations FOR SELECT
  USING (share_id IS NOT NULL);

-- shared_results에 AI 해설 포함 여부 + 해설 텍스트 추가
ALTER TABLE shared_results
  ADD COLUMN show_ai_explanation boolean NOT NULL DEFAULT false;
ALTER TABLE shared_results
  ADD COLUMN ai_explanation_text text;
