import { supabase, isSupabaseAvailable } from '../supabase';
import { canTryOn, incrementTryOnCount } from '../tryOnLimit';

interface TryOnParams {
  outfitId: string;
  personImageUrl: string;
  garmentImageUrl: string;
  garmentDescription?: string;
  sessionId?: string;  // 있으면 Edge Function이 user 전용 경로에 저장
  itemId?: string;     // 아이템별 Storage 경로 분리용
}

interface TryOnResult {
  imageUrl: string;
}

export type TryOnStatus = 'ok' | 'limit_reached' | 'error';

export interface TryOnOutcome {
  status: TryOnStatus;
  imageUrl?: string;
}

export async function generateTryOn(params: TryOnParams): Promise<TryOnOutcome> {
  if (!isSupabaseAvailable) {
    return { status: 'error' };
  }

  if (!canTryOn()) {
    return { status: 'limit_reached' };
  }

  incrementTryOnCount();

  console.info('[generateTryOn] →', {
    outfitId: params.outfitId,
    personImageUrl: params.personImageUrl,
    garmentImageUrl: params.garmentImageUrl,
  });

  try {
    const { data, error } = await supabase!.functions.invoke<TryOnResult>('tryon', {
      body: {
        personImageUrl: params.personImageUrl,
        garmentImageUrl: params.garmentImageUrl,
        garmentDescription: params.garmentDescription,
        outfitId: params.outfitId,
        sessionId: params.sessionId,
        itemId: params.itemId,
      },
    });

    if (error) {
      // FunctionsHttpError 실제 body 추출 (Replicate 오류 메시지 포함)
      let detail = String(error);
      try {
        const body = await (error as { context?: Response }).context?.json();
        detail = JSON.stringify(body);
      } catch { /* ignore */ }
      console.warn('[generateTryOn] Edge Function error:', detail);
      return { status: 'error' };
    }

    if (!data?.imageUrl) {
      console.warn('[generateTryOn] no imageUrl in response:', JSON.stringify(data));
      return { status: 'error' };
    }

    console.info('[generateTryOn] success →', data.imageUrl);
    return { status: 'ok', imageUrl: data.imageUrl };
  } catch (err) {
    console.warn('[generateTryOn] unexpected error:', err);
    return { status: 'error' };
  }
}
