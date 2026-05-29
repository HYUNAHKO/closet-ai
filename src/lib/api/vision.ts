import { supabase, isSupabaseAvailable } from '../supabase';
import type { ClothingItem } from '../../types';

export interface ClassifyResult {
  category: ClothingItem['category'];
  colorHex: string;
  label: string;
  material?: string;
  style?: string;
  season?: string[];
}

/** classify Edge Function을 호출해 의류 이미지를 자동 분류한다. */
export async function classifyClothing(imageUrl: string): Promise<ClassifyResult | null> {
  if (!isSupabaseAvailable) {
    console.warn('[classifyClothing] Supabase not available — skipping');
    return null;
  }

  try {
    const { data, error } = await supabase!.functions.invoke<ClassifyResult>('classify', {
      body: { imageUrl },
    });

    if (error || !data) {
      console.error('[classifyClothing] error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[classifyClothing] unexpected error:', err);
    return null;
  }
}
