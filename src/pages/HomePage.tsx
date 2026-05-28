import { useState, useEffect } from 'react';
import { TopBar } from '../components/shared/TopBar';
import { BottomNav } from '../components/shared/BottomNav';
import { ContextLine } from '../components/home/ContextLine';
import { OutfitCard } from '../components/home/OutfitCard';
import { ActionChips } from '../components/home/ActionChips';
import { formatKoreanDate } from '../lib/mockData';
import { fetchRecommendations } from '../lib/api/recommendations';
import type { OutfitRecommendation } from '../types';

export function HomePage() {
  const [todayOutfit, setTodayOutfit] = useState<OutfitRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date();

  useEffect(() => {
    fetchRecommendations('demo-user-1', 1)
      .then(([first]) => {
        setTodayOutfit(first ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !todayOutfit) {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-cream">
        <TopBar variant="home" />
        <div className="px-[22px] pt-3 pb-1 animate-pulse space-y-2">
          <div className="h-3 bg-border rounded w-1/4" />
          <div className="h-7 bg-border rounded w-2/5" />
          <div className="h-3 bg-border rounded w-3/5" />
        </div>
        <div className="mx-[18px] mt-3 rounded-card bg-border aspect-[3/4] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream">
      <TopBar variant="home" />

      {/* 헤더 블록 */}
      <div className="px-[22px] pt-3 pb-1">
        <p className="text-[11px] text-ink-hint tracking-wide m-0 mb-1">
          {formatKoreanDate(today)}
        </p>
        <h1 className="font-serif text-[28px] font-normal text-ink m-0 leading-[1.1]">
          오늘의 코디
        </h1>
        <ContextLine context={todayOutfit.context} />
      </div>

      {/* 추천 카드 */}
      <OutfitCard outfit={todayOutfit} />

      {/* 보조 액션 */}
      <ActionChips />

      {/* 스페이서 */}
      <div className="flex-1" />

      {/* 하단 내비게이션 */}
      <BottomNav />
    </div>
  );
}
