import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface RecommendBody {
  user: {
    shoulderWidth: 'narrow' | 'medium' | 'wide';
    waistRatio: number;
    legRatio: number;
  };
  context: {
    date: string;
    weather: { tempMin: number; tempMax: number; condition: string };
    schedule?: { title: string; time: string };
  };
  items: Array<{
    category: string;
    label: string;
    colorHex: string;
  }>;
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body: RecommendBody = await req.json();
    const { user, context, items } = body;

    const shoulderMap = { narrow: '좁은 어깨', medium: '보통 어깨', wide: '넓은 어깨' };
    const shoulderDesc = shoulderMap[user.shoulderWidth];
    const legDesc = user.legRatio >= 0.5 ? '긴 다리 비율' : '짧은 다리 비율';
    const itemList = items.map((i) => `${i.label} (${i.category})`).join(', ');
    const scheduleTitle = context.schedule?.title ?? '';
    const scheduleText = context.schedule
      ? `일정: ${context.schedule.title} (${context.schedule.time})`
      : '특별한 일정 없음';

    const systemPrompt = `당신은 체형·일정·날씨 기반 코디 설명 AI입니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 일절 금지.
{ "body": "...", "schedule": "...", "weather": "..." }

규칙:
- body: ${shoulderDesc}, ${legDesc} 등 구체적 체형 특징을 반드시 명시
- schedule: 사용자 일정 단어 "${scheduleTitle}"를 직접 인용
- weather: ${context.weather.tempMin}-${context.weather.tempMax}°C 온도 숫자를 본문에 포함
- 각 필드 1-2문장
- "어울리신다", "좋아 보여요", "잘 어울릴 것" 같은 평가·칭찬 표현 금지
- 사실 기반 설명만`;

    const userMessage = `체형 정보:
- 어깨: ${shoulderDesc}
- 허리 비율: ${user.waistRatio.toFixed(2)}
- 다리 비율: ${user.legRatio.toFixed(2)} (${legDesc})

오늘 날씨: ${context.weather.tempMin}-${context.weather.tempMax}°C, ${context.weather.condition}
${scheduleText}

추천 코디: ${itemList}

위 정보를 바탕으로 JSON 형식의 코디 설명을 작성하세요.`;

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!apiRes.ok) {
      throw new Error(`Anthropic API error: ${apiRes.status} ${await apiRes.text()}`);
    }

    const apiData = await apiRes.json();
    const text: string = apiData.content?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON in response: ${text}`);

    const rationale = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(rationale), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[recommend] error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
