/**
 * 의류 아이템 CRUD API
 * Supabase 연결 가능 → DB 사용
 * Supabase 없음    → mockData fallback
 */
import { supabase, isSupabaseAvailable } from '../supabase';
import { demoClothingItems } from '../mockData';
import type { ClothingItem } from '../../types';

// ── Supabase Row → 앱 타입 변환 ──────────────────────────────
function rowToClothingItem(row: {
  id: string;
  owner_id: string;
  category: ClothingItem['category'];
  label: string;
  image_url: string;
  isolated_image_url: string;
  color_hex: string;
  material: string | null;
  style: string | null;
  season: string[] | null;
  wear_count: number;
  created_at: string;
}): ClothingItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    category: row.category,
    label: row.label,
    imageUrl: row.image_url,
    isolatedImageUrl: row.isolated_image_url,
    colorHex: row.color_hex,
    attributes: {
      material: row.material ?? undefined,
      style: row.style ?? undefined,
      season: row.season ?? undefined,
    },
    wearCount: row.wear_count,
    createdAt: new Date(row.created_at),
  };
}

// ── 의류 목록 조회 ───────────────────────────────────────────
export async function fetchClothingItems(userId: string): Promise<ClothingItem[]> {
  if (!isSupabaseAvailable) {
    // mock fallback
    return demoClothingItems.filter((item) => item.ownerId === userId);
  }

  const { data, error } = await supabase!
    .from('clothing_items')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchClothingItems] Supabase error — fallback to mock', error);
    return demoClothingItems.filter((item) => item.ownerId === userId);
  }

  return (data ?? []).map(rowToClothingItem);
}

// ── 의류 추가 ────────────────────────────────────────────────
export async function addClothingItem(
  item: Omit<ClothingItem, 'id' | 'wearCount' | 'createdAt'>
): Promise<ClothingItem | null> {
  if (!isSupabaseAvailable) {
    console.warn('[addClothingItem] Supabase not available');
    return null;
  }

  const { data, error } = await supabase!
    .from('clothing_items')
    .insert({
      owner_id: item.ownerId,
      category: item.category,
      label: item.label,
      image_url: item.imageUrl,
      isolated_image_url: item.isolatedImageUrl,
      color_hex: item.colorHex,
      material: item.attributes.material ?? null,
      style: item.attributes.style ?? null,
      season: item.attributes.season ?? null,
    } as never)
    .select()
    .single();

  if (error || !data) {
    console.error('[addClothingItem] Supabase error', error);
    return null;
  }

  return rowToClothingItem(data);
}

// ── 의류 삭제 ────────────────────────────────────────────────
export async function deleteClothingItem(itemId: string): Promise<boolean> {
  if (!isSupabaseAvailable) {
    console.warn('[deleteClothingItem] Supabase not available');
    return false;
  }

  const { error } = await supabase!
    .from('clothing_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('[deleteClothingItem] Supabase error', error);
    return false;
  }

  return true;
}

// ── 착용 횟수 증가 ───────────────────────────────────────────
export async function incrementWearCount(itemId: string): Promise<void> {
  if (!isSupabaseAvailable) return;
  void itemId;
}

// ── 전신 사진 Storage 업로드 (OutfitDetailPage 라이브 try-on용) ──
export async function uploadPersonImage(file: File): Promise<string | null> {
  if (!isSupabaseAvailable) return null;

  const ext = file.name.split('.').pop() ?? 'jpg';
  // RLS: first segment = 'demo-user-1' 고정 (현재 Storage 정책 준수)
  const path = `demo-user-1/person.${ext}`;

  const { error } = await supabase!.storage
    .from('clothing-images')
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) {
    console.warn('[uploadPersonImage] error:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase!.storage
    .from('clothing-images')
    .getPublicUrl(path);

  return publicUrl;
}

// ── 의류 이미지 Storage 업로드 ────────────────────────────────
export async function uploadClothingImage(
  userId: string,
  file: File,
): Promise<string | null> {
  if (!isSupabaseAvailable) return null;

  const ext = file.name.split('.').pop() ?? 'jpg';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  // 첫 번째 세그먼트 = userId — Storage RLS 정책 split_part(name,'/',1)='demo-user-1' 을 통과하기 위해
  const path = `${userId}/items/${uniqueName}`;

  const { error } = await supabase!.storage
    .from('clothing-images')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error('[uploadClothingImage] error:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase!.storage
    .from('clothing-images')
    .getPublicUrl(path);

  return publicUrl;
}
