import { supabase, isSupabaseAvailable } from '../supabase';
import { canTryOn, incrementTryOnCount } from '../tryOnLimit';

interface TryOnParams {
  outfitId: string;
  personImageUrl: string;
  garmentImageUrl: string;
  garmentDescription?: string;
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

  try {
    const { data, error } = await supabase!.functions.invoke<TryOnResult>('tryon', {
      body: {
        personImageUrl: params.personImageUrl,
        garmentImageUrl: params.garmentImageUrl,
        garmentDescription: params.garmentDescription,
        outfitId: params.outfitId,
      },
    });

    if (error || !data?.imageUrl) {
      console.warn('[generateTryOn] failed:', error);
      return { status: 'error' };
    }

    return { status: 'ok', imageUrl: data.imageUrl };
  } catch (err) {
    console.warn('[generateTryOn] unexpected error:', err);
    return { status: 'error' };
  }
}
