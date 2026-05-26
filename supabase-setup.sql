-- ============================================================
-- STRIXHAVEN PORTAL — SUPABASE SETUP
-- Run this entire script in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── REVEALS (DM-controlled field visibility) ───────────────
CREATE TABLE IF NOT EXISTS reveals (
  key       TEXT PRIMARY KEY,
  revealed  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reveals ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read reveals
CREATE POLICY "reveals_read" ON reveals
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only the DM can write reveals
CREATE POLICY "reveals_write" ON reveals
  FOR ALL USING (auth.jwt() ->> 'email' = 'adameaston99@gmail.com');

-- ─── MYSTERIES (shared party clue board) ────────────────────
CREATE TABLE IF NOT EXISTS mysteries (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL DEFAULT '',
  description  TEXT DEFAULT '',
  category     TEXT DEFAULT 'Clue',
  status       TEXT DEFAULT 'Open',
  player_notes TEXT DEFAULT '',
  date_added   TEXT DEFAULT '',
  created_by   UUID REFERENCES auth.users(id)
);

ALTER TABLE mysteries ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read and write mysteries
CREATE POLICY "mysteries_read" ON mysteries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "mysteries_write" ON mysteries
  FOR ALL USING (auth.role() = 'authenticated');

-- ─── PARTY NOTES (shared) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS party_notes (
  section     TEXT PRIMARY KEY,
  content     TEXT DEFAULT '',
  updated_by  UUID REFERENCES auth.users(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE party_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "party_notes_read" ON party_notes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "party_notes_write" ON party_notes
  FOR ALL USING (auth.role() = 'authenticated');

-- ─── PLAYER PRIVATE NOTES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS player_notes (
  user_id    UUID REFERENCES auth.users(id),
  section    TEXT,
  content    TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, section)
);

ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_notes_own" ON player_notes
  FOR ALL USING (auth.uid() = user_id);

-- ─── PLAYER RELATIONSHIPS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS player_relationships (
  user_id     UUID REFERENCES auth.users(id),
  npc_id      TEXT,
  status      TEXT DEFAULT 'Unknown',
  bond_score  INTEGER DEFAULT 0,
  notes       TEXT DEFAULT '',
  is_favorite BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, npc_id)
);

ALTER TABLE player_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_relationships_own" ON player_relationships
  FOR ALL USING (auth.uid() = user_id);

-- ─── PLAYER CLUBS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_clubs (
  user_id  UUID REFERENCES auth.users(id),
  club_id  TEXT,
  PRIMARY KEY (user_id, club_id)
);

ALTER TABLE player_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_clubs_own" ON player_clubs
  FOR ALL USING (auth.uid() = user_id);

-- ─── PLAYER JOBS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_jobs (
  user_id    UUID REFERENCES auth.users(id) PRIMARY KEY,
  job_id     TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE player_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_jobs_own" ON player_jobs
  FOR ALL USING (auth.uid() = user_id);
