-- ============================================================
-- Closet AI — 초기 스키마 마이그레이션
-- 파일명: 20260528000001_initial_schema.sql
-- 실행: Supabase Dashboard > SQL Editor에 전체 붙여넣고 Run
-- ============================================================

-- ----- ENUM 타입 -----
DO $$ BEGIN
  CREATE TYPE clothing_category AS ENUM (
    'top', 'bottom', 'shoes', 'bag', 'outerwear', 'dress'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE shoulder_width AS ENUM ('narrow', 'medium', 'wide');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================
-- 1. users
-- ===========================
CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,          -- Supabase Auth UID 또는 'demo-user-1' 형식
  name             TEXT NOT NULL,
  shoulder_width   shoulder_width NOT NULL DEFAULT 'medium',
  waist_ratio      NUMERIC(4,2) NOT NULL DEFAULT 0.70,
  leg_ratio        NUMERIC(4,2) NOT NULL DEFAULT 0.50,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 정책: 본인 행만 읽기/쓰기
CREATE POLICY "users: self read"   ON users FOR SELECT USING (auth.uid()::text = id OR id = 'demo-user-1');
CREATE POLICY "users: self insert" ON users FOR INSERT WITH CHECK (auth.uid()::text = id OR id = 'demo-user-1');
CREATE POLICY "users: self update" ON users FOR UPDATE USING (auth.uid()::text = id OR id = 'demo-user-1');

-- ===========================
-- 2. clothing_items
-- ===========================
CREATE TABLE IF NOT EXISTS clothing_items (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category            clothing_category NOT NULL,
  label               TEXT NOT NULL,
  image_url           TEXT NOT NULL DEFAULT '',
  isolated_image_url  TEXT NOT NULL DEFAULT '',
  color_hex           TEXT NOT NULL DEFAULT '#FFFFFF',
  material            TEXT,
  style               TEXT,
  season              TEXT[],
  wear_count          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clothing_items_owner_idx ON clothing_items(owner_id);

ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;

-- 정책: 본인 의류만 접근
CREATE POLICY "clothing_items: owner read"
  ON clothing_items FOR SELECT
  USING (owner_id = auth.uid()::text OR owner_id = 'demo-user-1');

CREATE POLICY "clothing_items: owner insert"
  ON clothing_items FOR INSERT
  WITH CHECK (owner_id = auth.uid()::text OR owner_id = 'demo-user-1');

CREATE POLICY "clothing_items: owner update"
  ON clothing_items FOR UPDATE
  USING (owner_id = auth.uid()::text OR owner_id = 'demo-user-1');

CREATE POLICY "clothing_items: owner delete"
  ON clothing_items FOR DELETE
  USING (owner_id = auth.uid()::text OR owner_id = 'demo-user-1');

-- ===========================
-- 3. outfit_recommendations
-- ===========================
CREATE TABLE IF NOT EXISTS outfit_recommendations (
  id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  context_date                DATE NOT NULL,
  context_weather_min         INT NOT NULL,
  context_weather_max         INT NOT NULL,
  context_weather_condition   TEXT NOT NULL,
  context_schedule_title      TEXT,
  context_schedule_time       TEXT,
  item_ids                    TEXT[] NOT NULL,   -- clothing_items.id 배열
  try_on_image_url            TEXT NOT NULL DEFAULT '',
  rationale_body              TEXT NOT NULL DEFAULT '',
  rationale_schedule          TEXT NOT NULL DEFAULT '',
  rationale_weather           TEXT NOT NULL DEFAULT '',
  hero_statement              TEXT NOT NULL DEFAULT '',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outfit_recs_user_idx ON outfit_recommendations(user_id);

ALTER TABLE outfit_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outfit_recs: owner read"
  ON outfit_recommendations FOR SELECT
  USING (user_id = auth.uid()::text OR user_id = 'demo-user-1');

CREATE POLICY "outfit_recs: owner insert"
  ON outfit_recommendations FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR user_id = 'demo-user-1');

CREATE POLICY "outfit_recs: owner update"
  ON outfit_recommendations FOR UPDATE
  USING (user_id = auth.uid()::text OR user_id = 'demo-user-1');

CREATE POLICY "outfit_recs: owner delete"
  ON outfit_recommendations FOR DELETE
  USING (user_id = auth.uid()::text OR user_id = 'demo-user-1');

-- ===========================
-- 4. saved_outfits
-- ===========================
CREATE TABLE IF NOT EXISTS saved_outfits (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outfit_id   TEXT NOT NULL REFERENCES outfit_recommendations(id) ON DELETE CASCADE,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, outfit_id)  -- 중복 저장 방지
);

CREATE INDEX IF NOT EXISTS saved_outfits_user_idx ON saved_outfits(user_id);

ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_outfits: owner read"
  ON saved_outfits FOR SELECT
  USING (user_id = auth.uid()::text OR user_id = 'demo-user-1');

CREATE POLICY "saved_outfits: owner insert"
  ON saved_outfits FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR user_id = 'demo-user-1');

CREATE POLICY "saved_outfits: owner delete"
  ON saved_outfits FOR DELETE
  USING (user_id = auth.uid()::text OR user_id = 'demo-user-1');

-- ===========================
-- Storage 버킷 (옷 이미지)
-- ===========================
-- Supabase Dashboard > Storage > New Bucket에서 직접 생성하거나 아래 SQL 사용
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothing-images', 'clothing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책: 인증된 사용자는 본인 폴더에만 업로드
CREATE POLICY "storage: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'clothing-images'
    AND (auth.uid()::text = split_part(name, '/', 1) OR split_part(name, '/', 1) = 'demo-user-1')
  );

CREATE POLICY "storage: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clothing-images');
