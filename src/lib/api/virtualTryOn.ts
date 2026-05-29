import { supabase, isSupabaseAvailable } from '../supabase';

interface TryOnParams {
  outfitId: string;
  personImageUrl: string;
  garmentImageUrl: string;
  garmentDescription?: string;
}

interface TryOnResult {
  imageUrl: string;
}

/** tryon Edge Function을 호출해 가상 시착 이미지를 생성하고 Storage URL을 반환. */
export async function generateTryOn(params: TryOnParams): Promise<string | null> {
  if (!isSupabaseAvailable) {
    console.warn('[generateTryOn] Supabase not available — skipping');
    return null;
  }

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
      console.error('[generateTryOn] error:', error);
      return null;
    }

    return data.imageUrl;
  } catch (err) {
    console.error('[generateTryOn] unexpected error:', err);
    return null;
  }
}
