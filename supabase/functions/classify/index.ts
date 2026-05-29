import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface ClassifyBody {
  imageUrl: string;
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
    const body: ClassifyBody = await req.json();
    const { imageUrl } = body;

    const systemPrompt = `당신은 의류 이미지 분류 AI입니다. 이미지를 보고 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 일절 없이 JSON만 반환하세요.
{
  "category": "top | bottom | shoes | bag | outerwear | dress 중 하나",
  "colorHex": "#XXXXXX (주요 색상 헥스 코드)",
  "label": "간결한 한국어 이름 (예: 화이트 린넨 셔츠)",
  "material": "소재 (예: 면, 울, 데님)",
  "style": "스타일 (예: 캐주얼, 클래식, 페미닌)",
  "season": ["봄", "여름", "가을", "겨울" 중 해당하는 것들]
}`;

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'url', url: imageUrl },
              },
              {
                type: 'text',
                text: '이 의류 이미지를 분류하고 JSON으로 반환하세요.',
              },
            ],
          },
        ],
      }),
    });

    if (!apiRes.ok) {
      throw new Error(`Anthropic API error: ${apiRes.status} ${await apiRes.text()}`);
    }

    const apiData = await apiRes.json();
    const text: string = apiData.content?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON in response: ${text}`);

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[classify] error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
