CREATE TABLE shared_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  input jsonb NOT NULL,
  result jsonb NOT NULL,
  show_my_info boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_shared_results_share_id ON shared_results(share_id);
CREATE INDEX idx_shared_results_user_id ON shared_results(user_id);

ALTER TABLE shared_results ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public share links)
CREATE POLICY "Anyone can read shared results"
  ON shared_results FOR SELECT
  USING (true);

-- Only owner can insert
CREATE POLICY "Owner can insert shared results"
  ON shared_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only owner can delete
CREATE POLICY "Owner can delete shared results"
  ON shared_results FOR DELETE
  USING (auth.uid() = user_id);
