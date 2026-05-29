/**
 * 추천 코디 API
 * Supabase 연결 가능 → DB 사용
 * Supabase 없음    → mockData fallback
 */
import { supabase, isSupabaseAvailable } from '../supabase';
import { demoRecommendations } from '../mockData';
import type { OutfitRecommendation, OutfitRationale, ClothingItem, UserProfile, TodayContext } from '../../types';
import type { OutfitRecommendationRow, ClothingItemRow, SavedOutfitRow } from '../../types/database';

// ── Row → 앱 타입 변환 ────────────────────────────────────
function rowToItem(r: ClothingItemRow): ClothingItem {
  return {
    id: r.id,
    ownerId: r.owner_id,
    category: r.category as ClothingItem['category'],
    label: r.label,
    imageUrl: r.image_url,
    isolatedImageUrl: r.isolated_image_url,
    colorHex: r.color_hex,
    attributes: {
      material: r.material ?? undefined,
      style: r.style ?? undefined,
      season: r.season ?? undefined,
    },
    wearCount: r.wear_count,
    createdAt: new Date(r.created_at),
  };
}

function rowToRecommendation(
  row: OutfitRecommendationRow,
  items: ClothingItem[]
): OutfitRecommendation {
  return {
    id: row.id,
    userId: row.user_id,
    context: {
      date: new Date(row.context_date),
      weather: {
        tempMin: row.context_weather_min,
        tempMax: row.context_weather_max,
        condition: row.context_weather_condition,
      },
      schedule: row.context_schedule_title
        ? { title: row.context_schedule_title, time: row.context_schedule_time ?? '' }
        : undefined,
    },
    items,
    tryOnImageUrl: row.try_on_image_url,
    rationale: {
      body: row.rationale_body,
      schedule: row.rationale_schedule,
      weather: row.rationale_weather,
    },
    heroStatement: row.hero_statement,
    createdAt: new Date(row.created_at),
  };
}

// ── 추천 코디 목록 조회 (최근 N개) ──────────────────────────
export async function fetchRecommendations(
  userId: string,
  limit = 5
): Promise<OutfitRecommendation[]> {
  if (!isSupabaseAvailable) {
    return demoRecommendations.filter((r) => r.userId === userId).slice(0, limit);
  }

  const { data: rows, error: recError } = await supabase!
    .from('outfit_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('try_on_image_url', { ascending: false })  // try-on 있는 코디 우선
    .order('created_at', { ascending: false })
    .limit(limit);

  if (recError || !rows?.length) {
    console.error('[fetchRecommendations] error — fallback to mock', recError);
    return demoRecommendations.filter((r) => r.userId === userId).slice(0, limit);
  }

  const typedRows = rows as unknown as OutfitRecommendationRow[];
  const allItemIds = [...new Set(typedRows.flatMap((r) => r.item_ids))];

  const { data: itemRows, error: itemError } = await supabase!
    .from('clothing_items')
    .select('*')
    .in('id', allItemIds);

  if (itemError) {
    console.error('[fetchRecommendations] items error — fallback to mock', itemError);
    return demoRecommendations.filter((r) => r.userId === userId).slice(0, limit);
  }

  const typedItemRows = (itemRows ?? []) as unknown as ClothingItemRow[];
  const itemMap = new Map(typedItemRows.map((r) => [r.id, rowToItem(r)]));

  return typedRows.map((row) => {
    const items = row.item_ids
      .map((id) => itemMap.get(id))
      .filter((item): item is ClothingItem => !!item);
    return rowToRecommendation(row, items);
  });
}

// ── 단일 추천 조회 ────────────────────────────────────────────
export async function fetchRecommendationById(
  outfitId: string
): Promise<OutfitRecommendation | null> {
  if (!isSupabaseAvailable) {
    return demoRecommendations.find((r) => r.id === outfitId) ?? null;
  }

  const { data: row, error } = await supabase!
    .from('outfit_recommendations')
    .select('*')
    .eq('id', outfitId)
    .single();

  if (error || !row) {
    console.error('[fetchRecommendationById] error — fallback to mock', error);
    return demoRecommendations.find((r) => r.id === outfitId) ?? null;
  }

  const typedRow = row as unknown as OutfitRecommendationRow;

  const { data: itemRows } = await supabase!
    .from('clothing_items')
    .select('*')
    .in('id', typedRow.item_ids);

  const items = ((itemRows ?? []) as unknown as ClothingItemRow[]).map(rowToItem);
  return rowToRecommendation(typedRow, items);
}

// ── 코디 저장 toggle ─────────────────────────────────────────
export async function toggleSavedOutfit(
  userId: string,
  outfitId: string
): Promise<boolean> {
  if (!isSupabaseAvailable) return false;

  const { data: existing } = await supabase!
    .from('saved_outfits')
    .select('id')
    .eq('user_id', userId)
    .eq('outfit_id', outfitId)
    .maybeSingle();

  const typedExisting = existing as unknown as Pick<SavedOutfitRow, 'id'> | null;

  if (typedExisting) {
    await supabase!.from('saved_outfits').delete().eq('id', typedExisting.id);
    return false;
  } else {
    await supabase!.from('saved_outfits').insert(
      { user_id: userId, outfit_id: outfitId } as never
    );
    return true;
  }
}

// ── recommend Edge Function — rationale 생성 ─────────────────
export async function generateRationale(params: {
  user: UserProfile;
  context: TodayContext;
  items: ClothingItem[];
}): Promise<OutfitRationale | null> {
  if (!isSupabaseAvailable) return null;

  try {
    const { data, error } = await supabase!.functions.invoke<OutfitRationale>('recommend', {
      body: {
        user: {
          shoulderWidth: params.user.bodyMeasurements.shoulderWidth,
          waistRatio: params.user.bodyMeasurements.waistRatio,
          legRatio: params.user.bodyMeasurements.legRatio,
        },
        context: {
          date: params.context.date.toISOString(),
          weather: params.context.weather,
          schedule: params.context.schedule,
        },
        items: params.items.map((item) => ({
          category: item.category,
          label: item.label,
          colorHex: item.colorHex,
        })),
      },
    });

    if (error || !data) {
      console.error('[generateRationale] error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[generateRationale] unexpected error:', err);
    return null;
  }
}

// ── 저장된 코디 목록 ─────────────────────────────────────────
export async function fetchSavedOutfits(userId: string): Promise<OutfitRecommendation[]> {
  if (!isSupabaseAvailable) return [];

  const { data: saved, error } = await supabase!
    .from('saved_outfits')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error || !saved?.length) return [];

  const typedSaved = saved as unknown as SavedOutfitRow[];
  const outfitIds = typedSaved.map((s) => s.outfit_id);

  const { data: rows } = await supabase!
    .from('outfit_recommendations')
    .select('*')
    .in('id', outfitIds);

  if (!rows?.length) return [];

  const typedRows = rows as unknown as OutfitRecommendationRow[];
  const allItemIds = [...new Set(typedRows.flatMap((r) => r.item_ids))];

  const { data: itemRows } = await supabase!
    .from('clothing_items')
    .select('*')
    .in('id', allItemIds);

  const typedItemRows = (itemRows ?? []) as unknown as ClothingItemRow[];
  const itemMap = new Map(typedItemRows.map((r) => [r.id, rowToItem(r)]));

  return typedRows.map((row) => {
    const items = row.item_ids
      .map((id: string) => itemMap.get(id))
      .filter((item): item is ClothingItem => !!item);
    return rowToRecommendation(row, items);
  });
}
