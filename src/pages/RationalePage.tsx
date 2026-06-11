import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/shared/TopBar';
import { OutfitMiniReference } from '../components/rationale/OutfitMiniReference';
import { ReasoningBlock } from '../components/rationale/ReasoningBlock';
import { fetchRecommendationById, toggleSavedOutfit } from '../lib/api/recommendations';
import { tryOnDisplayKey } from '../lib/sessionId';
import type { OutfitRecommendation, ClothingItem } from '../types';

const HERO_PRIORITY: ClothingItem['category'][] = ['top', 'outerwear', 'dress', 'bottom'];

export function RationalePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState<OutfitRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchRecommendationById(id ?? 'outfit-1')
      .then((data) => setOutfit(data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!outfit) return;
    const isSaved = await toggleSavedOutfit('demo-user-1', outfit.id);
    setSaved(isSaved);
  };

  if (loading || !outfit) {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-cream animate-pulse">
        <div className="h-16 bg-border-light" />
        <div className="mx-[22px] mt-3 space-y-3">
          <div className="h-5 bg-border rounded w-3/4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-border rounded-[12px]" />
          ))}
        </div>
      </div>
    );
  }

  const { rationale, heroStatement } = outfit;

  // 사용자 본인 try-on이 있으면 우선 표시, 없으면 프리캐시 fallback
  const userTryOnUrl = localStorage.getItem(tryOnDisplayKey(outfit.id));
  const displayUrl = userTryOnUrl ?? outfit.tryOnImageUrl;

  // 상세 페이지와 동일한 hero 우선순위로 어떤 옷을 입었는지 특정
  const heroItem = userTryOnUrl
    ? HERO_PRIORITY.reduce<ClothingItem | null>((found, cat) => {
        if (found) return found;
        return outfit.items.find((i) => i.category === cat && i.imageUrl) ?? null;
      }, null)
    : null; // 프리캐시(데모)면 라벨 불필요

  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream">
      <TopBar variant="rationale" />

      {/* 코디 미니 레퍼런스 */}
      <OutfitMiniReference
        items={outfit.items}
        tryOnImageUrl={displayUrl}
        heroItem={heroItem}
      />

      {/* 에디토리얼 히어로 문장 */}
      <div className="px-[22px] pt-2">
        <h1 className="font-serif text-[21px] font-normal text-ink m-0 leading-[1.3]">
          {heroStatement}
        </h1>
      </div>

      {/* 근거 블록 × 3 */}
      <div className="px-[22px] pt-3.5">
        <ReasoningBlock type="body" text={rationale.body} />
        <ReasoningBlock type="schedule" text={rationale.schedule} />
        <ReasoningBlock type="weather" text={rationale.weather} isLast />
      </div>

      {/* 저장 CTA */}
      <div className="px-[18px] pt-1">
        <button
          onClick={handleSave}
          className={`w-full py-[13px] border-none rounded-cta text-[13px] font-medium font-sans cursor-pointer flex justify-center items-center gap-1.5 transition-colors ${
            saved ? 'bg-brand text-white' : 'bg-ink text-cream'
          }`}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill={saved ? 'white' : '#FAF6EF'}
            stroke={saved ? 'white' : '#FAF6EF'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {saved ? '저장됨' : '이 코디 저장하기'}
        </button>
      </div>

      {/* 보조 액션 */}
      <div className="flex justify-center px-[18px] py-2 pb-[18px]">
        <button
          onClick={() => navigate('/')}
          className="bg-transparent border-none text-[11px] text-ink-muted py-2 px-1.5 font-sans cursor-pointer"
        >
          다른 추천 보기
        </button>
      </div>
    </div>
  );
}
