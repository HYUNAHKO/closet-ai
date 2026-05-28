/**
 * Supabase 스키마 타입 (수동 정의)
 * 실제 프로젝트 연결 후 `supabase gen types typescript` 로 자동 재생성 가능.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ----- Row 타입 -----
export interface UserRow {
  id: string;
  name: string;
  shoulder_width: 'narrow' | 'medium' | 'wide';
  waist_ratio: number;
  leg_ratio: number;
  created_at: string;
}

export interface ClothingItemRow {
  id: string;
  owner_id: string;
  category: 'top' | 'bottom' | 'shoes' | 'bag' | 'outerwear' | 'dress';
  label: string;
  image_url: string;
  isolated_image_url: string;
  color_hex: string;
  material: string | null;
  style: string | null;
  season: string[] | null;
  wear_count: number;
  created_at: string;
}

export interface OutfitRecommendationRow {
  id: string;
  user_id: string;
  context_date: string;
  context_weather_min: number;
  context_weather_max: number;
  context_weather_condition: string;
  context_schedule_title: string | null;
  context_schedule_time: string | null;
  item_ids: string[];
  try_on_image_url: string;
  rationale_body: string;
  rationale_schedule: string;
  rationale_weather: string;
  hero_statement: string;
  created_at: string;
}

export interface SavedOutfitRow {
  id: string;
  user_id: string;
  outfit_id: string;
  saved_at: string;
}

// ----- Insert 타입 -----
export type ClothingItemInsert = Omit<ClothingItemRow, 'id' | 'wear_count' | 'created_at'> & {
  id?: string;
  wear_count?: number;
  created_at?: string;
};

export type SavedOutfitInsert = Omit<SavedOutfitRow, 'id' | 'saved_at'> & {
  id?: string;
  saved_at?: string;
};

// ----- Database 제네릭 타입 (createClient용) -----
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Partial<UserRow> & { id: string; name: string; shoulder_width: 'narrow' | 'medium' | 'wide'; waist_ratio: number; leg_ratio: number; };
        Update: Partial<UserRow>;
      };
      clothing_items: {
        Row: ClothingItemRow;
        Insert: ClothingItemInsert;
        Update: Partial<ClothingItemInsert>;
      };
      outfit_recommendations: {
        Row: OutfitRecommendationRow;
        Insert: Partial<OutfitRecommendationRow> & {
          user_id: string;
          context_date: string;
          context_weather_min: number;
          context_weather_max: number;
          context_weather_condition: string;
          item_ids: string[];
        };
        Update: Partial<OutfitRecommendationRow>;
      };
      saved_outfits: {
        Row: SavedOutfitRow;
        Insert: SavedOutfitInsert;
        Update: Partial<SavedOutfitInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      clothing_category: 'top' | 'bottom' | 'shoes' | 'bag' | 'outerwear' | 'dress';
      shoulder_width: 'narrow' | 'medium' | 'wide';
    };
  };
}
