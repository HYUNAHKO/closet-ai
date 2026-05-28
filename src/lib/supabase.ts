import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// 환경 변수가 없으면 null 반환 → mock fallback 경로에서 처리
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;

/** 환경 변수가 설정돼 있어 Supabase를 쓸 수 있는지 여부 */
export const isSupabaseAvailable = supabase !== null;
