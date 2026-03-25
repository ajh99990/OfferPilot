CREATE TABLE IF NOT EXISTS app_user_profile (
  user_id BIGINT PRIMARY KEY,
  nickname TEXT NOT NULL,
  avatar_url TEXT NULL,
  profile_setup_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mission_thread_access (
  thread_id TEXT PRIMARY KEY,
  owner_user_id BIGINT NULL REFERENCES app_user_profile(user_id) ON DELETE SET NULL,
  created_by_guest_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mission_thread_access_owner_user_id_idx
  ON mission_thread_access(owner_user_id);
