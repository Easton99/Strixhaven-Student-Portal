-- ============================================================
-- STRIXHAVEN PORTAL — DM DASHBOARD SETUP
-- Run this once in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

-- 1. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL,
  user_name  TEXT,
  user_avatar TEXT,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  entity_name TEXT,
  old_value   TEXT,
  new_value   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "insert_own_activity" ON activity_log
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "read_own_activity" ON activity_log
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "dm_read_all_activity" ON activity_log
    FOR SELECT TO authenticated USING (auth.email() = 'adameaston99@gmail.com');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 2. PLAYER PROFILES
CREATE TABLE IF NOT EXISTS player_profiles (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID UNIQUE,
  player_name    TEXT,
  character_name TEXT,
  college        TEXT,
  email          TEXT,
  avatar_url     TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  last_seen      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "own_profile_all" ON player_profiles
    FOR ALL TO authenticated
    USING (auth.uid() = user_id OR email = auth.email())
    WITH CHECK (auth.uid() = user_id OR auth.email() = 'adameaston99@gmail.com');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "dm_read_all_profiles" ON player_profiles
    FOR SELECT TO authenticated USING (auth.email() = 'adameaston99@gmail.com');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "dm_manage_profiles" ON player_profiles
    FOR ALL TO authenticated USING (auth.email() = 'adameaston99@gmail.com')
    WITH CHECK (auth.email() = 'adameaston99@gmail.com');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 3. DM CAN READ ALL PLAYER RELATIONSHIPS
DO $$ BEGIN
  CREATE POLICY "dm_read_all_relationships" ON player_relationships
    FOR SELECT TO authenticated USING (auth.email() = 'adameaston99@gmail.com');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 4. DM CAN READ ALL PLAYER NOTES
DO $$ BEGIN
  CREATE POLICY "dm_read_all_player_notes" ON player_notes
    FOR SELECT TO authenticated USING (auth.email() = 'adameaston99@gmail.com');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
