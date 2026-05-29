/**
 * outfit-1의 실제 Claude API rationale 생성 + 검증 + DB 업데이트
 *
 * 실행:
 *   npx tsx scripts/generate-rationale.ts
 *
 * 필요 환경 변수 (.env.local):
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ .env.local에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TARGET_OUTFIT = 'outfit-1';

// ── 검증 기준 4개 ────────────────────────────────────────────
interface Rationale { body: string; schedule: string; weather: string; }

function validate(r: Rationale): { pass: boolean; issues: string[] } {
  const issues: string[] = [];

  // 1. 미사여구 금지
  const forbidden = ['어울리', '세련', '예뻐', '좋아 보', '멋있', '잘 어울', '잘 맞'];
  const fullText = `${r.body} ${r.schedule} ${r.weather}`;
  for (const word of forbidden) {
    if (fullText.includes(word)) issues.push(`❌ 미사여구 발견: "${word}"`);
  }

  // 2. 체형 특징 명시 (body 필드)
  const bodyKeywords = ['어깨', '다리', '허리', '비율', '실루엣', '라인'];
  if (!bodyKeywords.some(k => r.body.includes(k))) {
    issues.push('❌ body: 체형 특징 언급 없음 (어깨/다리/허리/비율/실루엣/라인)');
  }

  // 3. 일정 단어 직접 인용 (schedule 필드)
  const scheduleKeywords = ['카페', '미팅', '외출', '브런치', '회의', '산책'];
  if (!scheduleKeywords.some(k => r.schedule.includes(k))) {
    issues.push('❌ schedule: 일정 단어 직접 인용 없음');
  }

  // 4. 온도 숫자 포함 (weather 필드)
  if (!/\d+[–\-~]?\d*°?C/.test(r.weather) && !/\d+도/.test(r.weather)) {
    issues.push('❌ weather: 온도 숫자 없음 (예: 18-24°C)');
  }

  return { pass: issues.length === 0, issues };
}

// ── 메인 ────────────────────────────────────────────────────
async function run() {
  console.log(`\n🔍 outfit-1 컨텍스트 로드 중...\n`);

  // 1. outfit-1 조회
  const { data: outfit, error: outfitErr } = await supabase
    .from('outfit_recommendations')
    .select('*')
    .eq('id', TARGET_OUTFIT)
    .single();

  if (outfitErr || !outfit) {
    console.error('❌ outfit-1 조회 실패:', outfitErr?.message);
    process.exit(1);
  }

  // 2. 의류 아이템 조회
  const { data: items } = await supabase
    .from('clothing_items')
    .select('id, category, label, color_hex')
    .in('id', outfit.item_ids);

  // 3. 사용자 체형 조회
  const { data: user } = await supabase
    .from('users')
    .select('shoulder_width, waist_ratio, leg_ratio')
    .eq('id', outfit.user_id)
    .single();

  const requestBody = {
    user: {
      shoulderWidth: (user as any)?.shoulder_width ?? 'narrow',
      waistRatio: (user as any)?.waist_ratio ?? 0.72,
      legRatio: (user as any)?.leg_ratio ?? 0.55,
    },
    context: {
      date: outfit.context_date,
      weather: {
        tempMin: outfit.context_weather_min,
        tempMax: outfit.context_weather_max,
        condition: outfit.context_weather_condition,
      },
      schedule: outfit.context_schedule_title
        ? { title: outfit.context_schedule_title, time: outfit.context_schedule_time ?? '' }
        : undefined,
    },
    items: ((items ?? []) as any[]).map((i) => ({
      category: i.category,
      label: i.label,
      colorHex: i.color_hex,
    })),
  };

  console.log('📋 요청 컨텍스트:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n🤖 recommend Edge Function 호출 중...\n');

  // 4. recommend Edge Function 호출
  const { data: rationale, error: fnErr } = await supabase.functions.invoke<Rationale>(
    'recommend',
    { body: requestBody },
  );

  if (fnErr || !rationale) {
    // 에러 본문 읽기
    let detail = String(fnErr);
    if (fnErr && typeof fnErr === 'object' && 'context' in fnErr) {
      try { detail = JSON.stringify(await (fnErr as any).context.json()); } catch {}
    }
    console.error('❌ Edge Function 실패:', detail);
    process.exit(1);
  }

  // 5. 응답 출력
  console.log('━'.repeat(60));
  console.log('📤 Claude API 응답 (raw):');
  console.log(JSON.stringify(rationale, null, 2));
  console.log('━'.repeat(60));

  console.log('\n📊 체형 · 일정 · 날씨 · 미사여구 검증:');
  console.log(`  body     : ${rationale.body}`);
  console.log(`  schedule : ${rationale.schedule}`);
  console.log(`  weather  : ${rationale.weather}`);

  const { pass, issues } = validate(rationale);

  if (!pass) {
    console.log('\n⚠️  검증 실패:');
    issues.forEach(i => console.log(' ', i));
    console.log('\n→ 프롬프트 조건을 강화한 뒤 재시도하세요.');
    console.log('  DB는 업데이트하지 않았습니다.\n');
    process.exit(1);
  }

  console.log('\n✅ 검증 통과 — 4가지 조건 모두 만족\n');

  // 6. DB 업데이트
  console.log(`📝 outfit_recommendations.${TARGET_OUTFIT} rationale 업데이트 중...`);
  const { error: updateErr } = await supabase
    .from('outfit_recommendations')
    .update({
      rationale_body: rationale.body,
      rationale_schedule: rationale.schedule,
      rationale_weather: rationale.weather,
    })
    .eq('id', TARGET_OUTFIT);

  if (updateErr) {
    console.error('❌ DB 업데이트 실패:', updateErr.message);
    process.exit(1);
  }

  console.log('✅ DB 업데이트 완료!');
  console.log('\n👉 다음: npm run dev → /outfit/outfit-1/rationale 에서 새 텍스트 확인\n');
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
