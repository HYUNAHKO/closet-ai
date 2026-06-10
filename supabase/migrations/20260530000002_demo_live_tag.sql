-- Q&A 라이브 시연용 컨텍스트를 구분하는 태그
-- demo_live = true인 추천 1세트는 발표 후반 Q&A 때 라이브 API 호출용으로 보관

ALTER TABLE outfit_recommendations
  ADD COLUMN IF NOT EXISTS demo_live boolean DEFAULT false;

-- 데모 라이브용 코디 1건 지정 (outfit-1 또는 실제 Supabase ID로 교체)
-- UPDATE outfit_recommendations
--   SET demo_live = true
--   WHERE id = 'YOUR_LIVE_DEMO_OUTFIT_ID';

-- 인덱스 (demo_live 조회가 빠르도록)
CREATE INDEX IF NOT EXISTS idx_outfit_demo_live
  ON outfit_recommendations (demo_live)
  WHERE demo_live = true;
