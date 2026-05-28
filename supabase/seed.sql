-- ============================================================
-- Closet AI — 시드 데이터
-- 파일: supabase/seed.sql
-- 실행: 마이그레이션 SQL 실행 후 이 파일을 SQL Editor에 붙여넣고 Run
-- ============================================================

-- ----- 기존 데모 데이터 초기화 (재실행 안전) -----
DELETE FROM saved_outfits      WHERE user_id = 'demo-user-1';
DELETE FROM outfit_recommendations WHERE user_id = 'demo-user-1';
DELETE FROM clothing_items     WHERE owner_id = 'demo-user-1';
DELETE FROM users              WHERE id = 'demo-user-1';

-- ===========================
-- 1. 데모 사용자
-- ===========================
INSERT INTO users (id, name, shoulder_width, waist_ratio, leg_ratio)
VALUES (
  'demo-user-1',
  '지수',
  'narrow',
  0.72,
  0.55
);

-- ===========================
-- 2. 의류 15벌
-- ===========================
INSERT INTO clothing_items
  (id, owner_id, category, label, image_url, isolated_image_url, color_hex, material, style, season, wear_count, created_at)
VALUES
  -- 상의 4벌
  ('item-1',  'demo-user-1', 'top',      '오트 드롭숄더 니트',       '', '', '#E8DCC4', '니트',   '캐주얼',      ARRAY['봄','가을'],              12, '2024-09-01'),
  ('item-2',  'demo-user-1', 'top',      '화이트 크루넥 티셔츠',     '', '', '#FFFFFF', '면',     '베이직',      ARRAY['봄','여름','가을'],        25, '2024-06-01'),
  ('item-3',  'demo-user-1', 'top',      '스트라이프 린넨 셔츠',     '', '', '#F5F0E8', '린넨',   '캐주얼',      ARRAY['봄','여름'],               7,  '2024-05-10'),
  ('item-4',  'demo-user-1', 'top',      '테라코타 오버핏 맨투맨',   '', '', '#C56F45', '면혼방', '캐주얼',      ARRAY['봄','가을','겨울'],        9,  '2024-10-15'),

  -- 하의 4벌
  ('item-5',  'demo-user-1', 'bottom',   '올리브 와이드 트라우저',   '', '', '#5A5946', '면',     '세미캐주얼',  ARRAY['봄','여름','가을'],        8,  '2024-09-15'),
  ('item-6',  'demo-user-1', 'bottom',   '다크 스트레이트 데님',     '', '', '#3D3833', '데님',   '캐주얼',      ARRAY['봄','가을'],               18, '2024-08-20'),
  ('item-7',  'demo-user-1', 'bottom',   '크림 A라인 미디 스커트',   '', '', '#FAF6EF', '폴리',   '페미닌',      ARRAY['봄','여름'],               4,  '2024-04-01'),
  ('item-8',  'demo-user-1', 'bottom',   '차콜 슬림 슬랙스',         '', '', '#4A4A48', '울혼방', '오피스',      ARRAY['봄','가을','겨울'],        11, '2024-03-20'),

  -- 신발 3벌
  ('item-9',  'demo-user-1', 'shoes',    '레더 로퍼',                '', '', '#8B6F47', '가죽',   '클래식',      ARRAY['봄','가을'],               20, '2024-08-01'),
  ('item-10', 'demo-user-1', 'shoes',    '스킨톤 스니커즈',          '', '', '#F0E2CC', '캔버스', '캐주얼',      ARRAY['봄','여름'],               10, '2024-05-15'),
  ('item-11', 'demo-user-1', 'shoes',    '블랙 앵클 부츠',           '', '', '#2A2A28', '가죽',   '엣지',        ARRAY['가을','겨울'],             6,  '2023-10-01'),

  -- 가방 2개
  ('item-12', 'demo-user-1', 'bag',      '테라코타 토트백',          '', '', '#C56F45', '캔버스', '캐주얼',      ARRAY['봄','여름','가을','겨울'], 15, '2024-07-20'),
  ('item-13', 'demo-user-1', 'bag',      '아이보리 버킷백',          '', '', '#F7F3EC', '가죽',   '미니멀',      ARRAY['봄','여름'],               5,  '2024-04-10'),

  -- 아우터 2벌
  ('item-14', 'demo-user-1', 'outerwear','블랙 오버핏 코트',         '', '', '#2A2A28', '울',     '클래식',      ARRAY['가을','겨울'],             5,  '2024-10-01'),
  ('item-15', 'demo-user-1', 'outerwear','오트 린넨 재킷',           '', '', '#E8DCC4', '린넨',   '캐주얼',      ARRAY['봄','여름'],               3,  '2024-04-25')
;

-- ===========================
-- 3. 추천 코디 2개
-- ===========================
INSERT INTO outfit_recommendations
  (id, user_id, context_date, context_weather_min, context_weather_max,
   context_weather_condition, context_schedule_title, context_schedule_time,
   item_ids, try_on_image_url, rationale_body, rationale_schedule,
   rationale_weather, hero_statement, created_at)
VALUES
  (
    'outfit-1',
    'demo-user-1',
    '2026-05-28',
    18, 24,
    '맑음',
    '카페 미팅',
    '오후',
    ARRAY['item-1', 'item-5', 'item-9', 'item-12'],
    '',
    '어깨가 좁은 편이라, 드롭 숄더 실루엣의 오트 컬러 니트가 라인을 자연스럽게 확장시켜줘요.',
    '오후 카페 미팅이라는 캐주얼-세미캐주얼 톤에 맞춰, 격식보다 편안함을 우선했어요.',
    '18-24°C 일교차에 얇은 니트 한 겹이 적당해요. 더우면 소매를 살짝 걷어도 핏이 유지돼요.',
    '어깨 라인을 부드럽게 풀어주는 코디예요',
    '2026-05-28'
  ),
  (
    'outfit-2',
    'demo-user-1',
    '2026-05-28',
    18, 24,
    '맑음',
    '캐주얼 외출',
    '낮',
    ARRAY['item-2', 'item-6', 'item-10', 'item-12'],
    '',
    '다리 비율이 긴 편이라, 스트레이트 데님과 크루넥 티의 조합이 전체 실루엣을 더 길어 보이게 해줘요.',
    '캐주얼 외출이라는 자유로운 상황에 맞춰, 코디 전체를 편안한 베이직 톤으로 구성했어요.',
    '18-24°C의 화창한 날씨에 얇은 면 티셔츠 한 겹이 딱 맞아요. 기온이 떨어지면 가방에 재킷 하나 추가하세요.',
    '긴 다리 비율을 살린 데일리 스트릿 룩',
    '2026-05-28'
  )
;
