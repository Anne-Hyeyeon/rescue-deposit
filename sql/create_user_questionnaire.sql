CREATE TABLE user_questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responses jsonb NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_questionnaire_user_id ON user_questionnaire_responses(user_id);

ALTER TABLE user_questionnaire_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own responses"
  ON user_questionnaire_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
  ON user_questionnaire_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
