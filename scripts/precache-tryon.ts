/**
 * 데모용 try-on 사전 캐싱 스크립트
 *
 * 실행 방법:
 *   npm install -D tsx dotenv
 *   npx tsx scripts/precache-tryon.ts
 *
 * 필요한 환경 변수 (.env.local):
 *   VITE_SUPABASE_URL=https://xxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 *   PRECACHE_PERSON_IMAGE_URL=<전신 사진 Supabase Storage 공개 URL>
 *
 * 사전 준비:
 *   1. Supabase Storage 'clothing-images' 버킷에 전신 사진 업로드
 *      경로: person/demo-model.jpg
 *   2. PRECACHE_PERSON_IMAGE_URL 에 해당 공개 URL 설정
 *   3. 각 의류 아이템의 image_url 이 Storage에 업로드되어 있어야 함
 *      (WardrobePage에서 사진 추가 후 자동 업로드됨)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });   // Vite는 .env.local 사용 — 기본 .env가 아님
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const PERSON_IMAGE_URL = process.env.PRECACHE_PERSON_IMAGE_URL;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ .env.local에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 설정하세요.');
  process.exit(1);
}
if (!PERSON_IMAGE_URL) {
  console.error('❌ .env.local에 PRECACHE_PERSON_IMAGE_URL을 설정하세요.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const FORCE = process.argv.includes('--force');

// 데모 컨텍스트 5개 — seed.sql의 2개 + 추가 3개
const DEMO_OUTFITS = [
  { id: 'outfit-1', description: '오트 드롭숄더 니트' },
  { id: 'outfit-2', description: '화이트 크루넥 티셔츠' },
  { id: 'outfit-3', description: '스트라이프 린넨 셔츠' },
  { id: 'outfit-4', description: '테라코타 오버핏 맨투맨' },
  { id: 'outfit-5', description: '오트 린넨 재킷' },
];

// 추가 컨텍스트 3개 — outfit-3 ~ outfit-5 는 DB에 없으므로 먼저 생성
const EXTRA_OUTFITS = [
  {
    id: 'outfit-3',
    user_id: 'demo-user-1',
    context_date: '2026-05-29',
    context_weather_min: 20,
    context_weather_max: 26,
    context_weather_condition: '맑음',
    context_schedule_title: '친구 브런치',
    context_schedule_time: '오전',
    item_ids: ['item-3', 'item-5', 'item-10', 'item-13'],
    try_on_image_url: '',
    rationale_body: '좁은 어깨에 스트라이프 패턴의 수직선이 어깨폭을 시각적으로 보완해줘요.',
    rationale_schedule: '친구 브런치라는 캐주얼-페스티브 분위기에 맞춰 린넨 소재로 가볍게 구성했어요.',
    rationale_weather: '20-26°C의 따뜻한 날씨에 린넨 셔츠 한 겹이 적당해요.',
    hero_statement: '봄 브런치에 딱 맞는 린넨 데이룩',
    created_at: '2026-05-29',
  },
  {
    id: 'outfit-4',
    user_id: 'demo-user-1',
    context_date: '2026-05-30',
    context_weather_min: 16,
    context_weather_max: 22,
    context_weather_condition: '흐림',
    context_schedule_title: '팀 회의',
    context_schedule_time: '오후',
    item_ids: ['item-4', 'item-8', 'item-9', 'item-12'],
    try_on_image_url: '',
    rationale_body: '좁은 어깨 실루엣에 테라코타 오버핏 맨투맨이 어깨 라인을 자연스럽게 넓혀줘요.',
    rationale_schedule: '팀 회의라는 세미포멀 상황에 슬랙스로 하의를 정돈했어요.',
    rationale_weather: '16-22°C 흐린 날 맨투맨 한 겹이 적절한 보온을 제공해요.',
    hero_statement: '흐린 날에도 선명한 테라코타 컬러로',
    created_at: '2026-05-30',
  },
  {
    id: 'outfit-5',
    user_id: 'demo-user-1',
    context_date: '2026-05-31',
    context_weather_min: 19,
    context_weather_max: 25,
    context_weather_condition: '맑음',
    context_schedule_title: '주말 산책',
    context_schedule_time: '오전',
    item_ids: ['item-2', 'item-7', 'item-10', 'item-13'],
    try_on_image_url: '',
    rationale_body: '긴 다리 비율을 강조하기 위해 크루넥 티와 미디 스커트의 허리 라인을 맞췄어요.',
    rationale_schedule: '주말 산책이라는 자유로운 상황에 크림 톤으로 전체를 통일했어요.',
    rationale_weather: '19-25°C 맑은 날 면 티셔츠 + 폴리 스커트 조합이 쾌적해요.',
    hero_statement: '크림 톤 미니멀 산책 코디',
    created_at: '2026-05-31',
  },
];

interface ClothingItemRow {
  id: string;
  image_url: string;
  label: string;
}

async function run() {
  console.log('🚀 Closet AI — try-on 사전 캐싱 시작\n');

  // 1. 추가 outfit 레코드 DB에 upsert
  console.log('1️⃣  추가 outfit 레코드 upsert...');
  for (const outfit of EXTRA_OUTFITS) {
    const { error } = await supabase
      .from('outfit_recommendations')
      .upsert(outfit as never, { onConflict: 'id', ignoreDuplicates: false });
    if (error) {
      console.warn(`  ⚠ outfit ${outfit.id} upsert 실패:`, error.message);
    } else {
      console.log(`  ✓ outfit ${outfit.id} (${outfit.context_schedule_title})`);
    }
  }

  // 2. 각 outfit의 대표 아이템 image_url 조회
  console.log('\n2️⃣  의류 이미지 URL 확인...');
  const allItemIds = DEMO_OUTFITS.flatMap((_, i) => {
    if (i < 2) return []; // outfit-1, outfit-2는 seed.sql에서 item_ids 확인
    return EXTRA_OUTFITS[i - 2]?.item_ids ?? [];
  });

  const { data: clothingRows } = await supabase
    .from('clothing_items')
    .select('id, image_url, label')
    .in('id', allItemIds.length ? allItemIds : ['__none__']);

  const itemMap = new Map<string, ClothingItemRow>(
    ((clothingRows ?? []) as ClothingItemRow[]).map((r) => [r.id, r])
  );

  // 3. 모든 outfit의 item_ids 조회
  const { data: outfitRows } = await supabase
    .from('outfit_recommendations')
    .select('id, item_ids, try_on_image_url')
    .eq('user_id', 'demo-user-1')
    .in('id', DEMO_OUTFITS.map((o) => o.id));

  if (!outfitRows?.length) {
    console.error('❌ outfit 레코드를 불러오지 못했습니다. seed.sql을 먼저 실행하세요.');
    process.exit(1);
  }

  // 4. try-on 생성 (이미 URL이 있는 건 --force 없으면 스킵)
  console.log(`\n3️⃣  try-on 이미지 생성...${FORCE ? ' (--force: 전체 재생성)' : ''}`);
  for (const outfit of outfitRows as Array<{ id: string; item_ids: string[]; try_on_image_url: string }>) {
    if (outfit.try_on_image_url && !FORCE) {
      console.log(`  ⏭ ${outfit.id} — 이미 캐싱됨, 스킵 (재생성하려면 --force)`);
      continue;
    }

    // 첫 번째 top 아이템의 이미지 URL 사용
    const garmentItem = outfit.item_ids
      .map((id) => itemMap.get(id))
      .find((item) => item?.image_url);

    if (!garmentItem?.image_url) {
      console.warn(`  ⚠ ${outfit.id} — 의류 이미지 없음. WardrobePage에서 사진을 먼저 업로드하세요.`);
      continue;
    }

    console.log(`  → ${outfit.id} 처리 중... (약 30-60초 소요)`);
    try {
      const { data, error } = await supabase.functions.invoke<{ imageUrl: string }>('tryon', {
        body: {
          personImageUrl: PERSON_IMAGE_URL,
          garmentImageUrl: garmentItem.image_url,
          garmentDescription: garmentItem.label,
          outfitId: outfit.id,
        },
      });

      if (error) {
        // FunctionsHttpError의 response body를 읽어서 실제 에러 출력
        let detail = '';
        if (error && typeof error === 'object' && 'context' in error) {
          try {
            const body = await (error as { context: Response }).context.json();
            detail = JSON.stringify(body);
          } catch {
            detail = String(error);
          }
        } else {
          detail = String(error);
        }
        console.error(`  ❌ ${outfit.id} 실패 — Edge Function 에러: ${detail}`);
      } else if (!data?.imageUrl) {
        console.error(`  ❌ ${outfit.id} 실패 — imageUrl 없음 (data: ${JSON.stringify(data)})`);
      } else {
        console.log(`  ✅ ${outfit.id} → ${data.imageUrl}`);
      }
    } catch (err) {
      console.error(`  ❌ ${outfit.id} 예외:`, err);
    }
  }

  console.log('\n✅ 사전 캐싱 완료!');
  console.log('Supabase 대시보드 → outfit_recommendations 테이블에서 try_on_image_url 확인하세요.');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
