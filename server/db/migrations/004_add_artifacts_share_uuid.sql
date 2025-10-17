ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS share_uuid UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_artifacts_share_uuid ON artifacts (share_uuid);
