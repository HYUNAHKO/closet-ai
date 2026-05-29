import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface TryOnBody {
  personImageUrl: string;
  garmentImageUrl: string;
  garmentDescription?: string;
  outfitId?: string;
}

const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!REPLICATE_API_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'REPLICATE_API_TOKEN not set' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body: TryOnBody = await req.json();
    const { personImageUrl, garmentImageUrl, garmentDescription = 'clothing item', outfitId } = body;
    console.log('[tryon] inputs:', { personImageUrl, garmentImageUrl, outfitId });

    // 1. IDM-VTON 최신 버전 해시 조회 (community 모델은 /v1/predictions + version 해시 방식 사용)
    console.log('[tryon] step 1: fetching versions');
    const versionsRes = await fetch(
      'https://api.replicate.com/v1/models/cuuupid/idm-vton/versions',
      { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` } },
    );
    if (!versionsRes.ok) {
      throw new Error(`Replicate versions error: ${versionsRes.status} ${await versionsRes.text()}`);
    }
    const versionsData = await versionsRes.json();
    const latestVersion: string = versionsData.results?.[0]?.id;
    console.log('[tryon] latestVersion:', latestVersion);
    if (!latestVersion) throw new Error('IDM-VTON 버전 조회 실패 — results 비어있음');

    // 2. 예측 생성
    console.log('[tryon] step 2: creating prediction');
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: latestVersion,
        input: {
          human_img: personImageUrl,
          garm_img: garmentImageUrl,
          garment_des: garmentDescription,
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42,
        },
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Replicate create error: ${createRes.status} ${await createRes.text()}`);
    }

    let prediction: { id: string; status: string; output?: string[] | string } = await createRes.json();
    console.log('[tryon] prediction created:', prediction.id, prediction.status);

    // 3. 완료될 때까지 폴링 (최대 120초, 5초 간격)
    let attempts = 0;
    while (
      prediction.status !== 'succeeded' &&
      prediction.status !== 'failed' &&
      attempts < 24
    ) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const pollRes = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` } },
      );
      prediction = await pollRes.json();
      attempts++;
    }

    console.log('[tryon] final status:', prediction.status, '| output type:', typeof prediction.output, '| isArray:', Array.isArray(prediction.output));
    console.log('[tryon] raw output:', JSON.stringify(prediction.output));

    if (prediction.status !== 'succeeded' || !prediction.output) {
      throw new Error(`Prediction failed or timed out: ${prediction.status}`);
    }

    // output은 모델에 따라 string 또는 string[] — 두 경우 모두 처리
    const rawOutput = prediction.output;
    const replicateImageUrl: string = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput;
    console.log('[tryon] resolved image URL:', replicateImageUrl);

    // 3. 결과 이미지를 Supabase Storage에 저장
    const imageRes = await fetch(replicateImageUrl);
    const imageBuffer = await imageRes.arrayBuffer();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const storagePath = `tryon/${outfitId ?? `temp-${Date.now()}`}.png`;

    const { error: uploadError } = await supabase.storage
      .from('clothing-images')
      .upload(storagePath, imageBuffer, { contentType: 'image/png', upsert: true });

    if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('clothing-images')
      .getPublicUrl(storagePath);

    // 4. DB의 try_on_image_url 업데이트 (outfitId 있을 때만)
    if (outfitId) {
      await supabase
        .from('outfit_recommendations')
        .update({ try_on_image_url: publicUrl })
        .eq('id', outfitId);
    }

    return new Response(JSON.stringify({ imageUrl: publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[tryon] error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
