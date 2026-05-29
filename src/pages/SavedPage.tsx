import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/shared/TopBar';
import { BottomNav } from '../components/shared/BottomNav';
import { fetchSavedOutfits } from '../lib/api/recommendations';
import { TryOnSilhouette } from '../components/home/TryOnSilhouette';
import type { OutfitRecommendation } from '../types';

function SavedOutfitCard({ outfit }: { outfit: OutfitRecommendation }) {
  const navigate = useNavigate();
  const contextLabel = outfit.context.schedule?.title ?? outfit.context.weather.condition;

  return (
    <div
      className="bg-white rounded-card border border-border overflow-hidden cursor-pointer active:opacity-80 transition-opacity"
      onClick={() => navigate(`/outfit/${outfit.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/outfit/${outfit.id}`)}
    >
      {/* 이미지 영역 */}
      <div className="relative w-full aspect-[3/4] flex items-center justify-center bg-cream">
        {outfit.tryOnImageUrl ? (
          <img
            src={outfit.tryOnImageUrl}
            alt="저장된 코디"
            className="w-full h-full object-cover"
          />
        ) : (
          <TryOnSilhouette variant="home" />
        )}
        {/* 컨텍스트 라벨 */}
        <span className="absolute top-2.5 left-2.5 bg-white/90 text-[10px] text-ink-muted px-2 py-0.5 rounded-pill">
          {contextLabel}
        </span>
      </div>

      {/* 텍스트 */}
      <div className="px-3 py-2.5">
        <p className="text-[12px] font-medium text-ink leading-snug line-clamp-2">
          {outfit.heroStatement}
        </p>
        <p className="text-[10px] text-ink-hint mt-0.5">
          {outfit.context.weather.tempMin}–{outfit.context.weather.tempMax}°C · {outfit.context.weather.condition}
        </p>
      </div>
    </div>
  );
}

export function SavedPage() {
  const [outfits, setOutfits] = useState<OutfitRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedOutfits('demo-user-1')
      .then(setOutfits)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream">
      <TopBar variant="wardrobe" title="저장됨" />

      <div className="px-[18px] pt-3 pb-2">
        <h1 className="font-serif text-[22px] text-ink leading-tight">저장한 코디</h1>
        {!loading && (
          <p className="text-[12px] text-ink-hint mt-0.5">{outfits.length}개 저장됨</p>
        )}
      </div>

      <div className="flex-1 px-[18px] pb-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-card border border-border overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-border" />
                <div className="px-3 py-2.5 space-y-1.5">
                  <div className="h-3 bg-border rounded w-3/4" />
                  <div className="h-2.5 bg-border rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : outfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8A8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p className="text-[13px] text-ink-hint">아직 저장한 코디가 없어요</p>
            <p className="text-[11px] text-ink-hint">코디 상세 화면에서 하트를 눌러 저장하세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {outfits.map((outfit) => (
              <SavedOutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
