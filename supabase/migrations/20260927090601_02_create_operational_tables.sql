/*
# Operational Tables — User profiles, recommendation events, kits, decisions, saved items, audit

1. Purpose
   - Store user-specific operational data: profiles, recommendation history,
     educator kit snapshots, educator decisions, saved items, audit events.
   - These are separate from the canonical repository tables.
   - Each user can only access their own data (row-level security by user_id).

2. Tables created:
   - user_profiles (id from auth.users, role, status, display_name)
   - recommendation_context_snapshots (immutable request state)
   - recommendation_events (recommendation execution records)
   - educator_kit_snapshots (immutable Kit content)
   - educator_decisions (SAVE_FOR_LATER etc.)
   - saved_items (lightweight bookmark for UI state)
   - audit_events (technical errors and audit trail)

3. Security
   - RLS enabled on all tables.
   - Users can only SELECT/INSERT their own rows (auth.uid() = user_id).
   - Admins can read all user_profiles and audit_events for user management.
   - user_profiles: users read/update own; admins read all.
*/

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'EDUCATOR',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_sign_in TIMESTAMPTZ
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_profile" ON user_profiles;
CREATE POLICY "users_read_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
CREATE POLICY "users_update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
CREATE POLICY "users_insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Admin can read all profiles (via a security definer function)
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'ACTIVE'
  );
$$;

DROP POLICY IF EXISTS "admin_read_all_profiles" ON user_profiles;
CREATE POLICY "admin_read_all_profiles" ON user_profiles FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admin_update_profiles" ON user_profiles;
CREATE POLICY "admin_update_profiles" ON user_profiles FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Recommendation context snapshots (immutable)
CREATE TABLE IF NOT EXISTS recommendation_context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  request_json JSONB NOT NULL,
  course_id TEXT,
  module_id TEXT,
  subtopic_id TEXT,
  application_context_summary TEXT,
  application_context_source TEXT,
  teaching_context_json JSONB,
  repository_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recommendation_context_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_snapshots" ON recommendation_context_snapshots;
CREATE POLICY "select_own_snapshots" ON recommendation_context_snapshots FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_snapshots" ON recommendation_context_snapshots;
CREATE POLICY "insert_own_snapshots" ON recommendation_context_snapshots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Recommendation events
CREATE TABLE IF NOT EXISTS recommendation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES recommendation_context_snapshots(id),
  decision_status TEXT NOT NULL,
  recommended_scr_id TEXT,
  recommended_scr_name TEXT,
  promoted_scr_ids TEXT,
  result_json JSONB NOT NULL,
  repository_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recommendation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON recommendation_events;
CREATE POLICY "select_own_events" ON recommendation_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_events" ON recommendation_events;
CREATE POLICY "insert_own_events" ON recommendation_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Educator kit snapshots (immutable)
CREATE TABLE IF NOT EXISTS educator_kit_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES recommendation_events(id),
  template_id TEXT,
  template_name TEXT,
  scr_id TEXT,
  scr_name TEXT,
  kit_content_json JSONB NOT NULL,
  validation_status TEXT NOT NULL,
  validation_report_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE educator_kit_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_kits" ON educator_kit_snapshots;
CREATE POLICY "select_own_kits" ON educator_kit_snapshots FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_kits" ON educator_kit_snapshots;
CREATE POLICY "insert_own_kits" ON educator_kit_snapshots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Educator decisions
CREATE TABLE IF NOT EXISTS educator_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES recommendation_events(id),
  kit_snapshot_id UUID REFERENCES educator_kit_snapshots(id),
  decision_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE educator_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_decisions" ON educator_decisions;
CREATE POLICY "select_own_decisions" ON educator_decisions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_decisions" ON educator_decisions;
CREATE POLICY "insert_own_decisions" ON educator_decisions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Saved items (lightweight bookmark)
CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES recommendation_events(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved" ON saved_items;
CREATE POLICY "select_own_saved" ON saved_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved" ON saved_items;
CREATE POLICY "insert_own_saved" ON saved_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved" ON saved_items;
CREATE POLICY "delete_own_saved" ON saved_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Audit events
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_audit" ON audit_events;
CREATE POLICY "select_own_audit" ON audit_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_audit" ON audit_events;
CREATE POLICY "insert_audit" ON audit_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_read_all_audit" ON audit_events;
CREATE POLICY "admin_read_all_audit" ON audit_events FOR SELECT
  TO authenticated USING (is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_user ON recommendation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON recommendation_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user ON recommendation_context_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_kits_user ON educator_kit_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_user ON educator_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_items(user_id);
