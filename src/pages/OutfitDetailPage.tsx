import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { TopBar } from '../components/shared/TopBar';
import { ContextBadge } from '../components/outfit/ContextBadge';
import { TryOnView } from '../components/outfit/TryOnView';
import { RationaleCTA } from '../components/outfit/RationaleCTA';
import { EmailCaptureModal } from '../components/shared/EmailCaptureModal';
import { fetchRecommendationById, toggleSavedOutfit } from '../lib/api/recommendations';
import { generateTryOn } from '../lib/api/virtualTryOn';
import { canTryOn, getTryOnCount, TRYON_LIMIT } from '../lib/tryOnLimit';
import { getSessionId, tryOnCacheKey, tryOnDisplayKey } from '../lib/sessionId';
import type { OutfitRecommendation, ClothingItem } from '../types';

const TRYON_CAPABLE = new Set<ClothingItem['category']>(['top', 'bottom', 'outerwear', 'dress']);
const HERO_PRIORITY: ClothingItem['category'][] = ['top', 'outerwear', 'dress', 'bottom'];

interface ItemTryOnState {
  status: 'idle' | 'loading' | 'ok' | 'error' | 'limit_reached';
  url: string | null;
}

function findHeroItem(items: ClothingItem[]): ClothingItem | null {
  for (const cat of HERO_PRIORITY) {
    const item = items.find((i) => i.category === cat && i.imageUrl);
    if (item) return item;
  }
  return null;
}

export function OutfitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState<OutfitRecommendation | null>(null);
  const [isHearted, setIsHearted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [tryOnStates, setTryOnStates] = useState<Record<string, ItemTryOnState>>({});
  // StrictMode 이중 실행 방지 — 코디당 1회 보장
  const inFlightRef = useRef<Set<string>>(new Set());

  const personUrl = localStorage.getItem('closet_person_url');

  useEffect(() => {
    fetchRecommendationById(id ?? 'outfit-1')
      .then((data) => {
        setOutfit(data);
        trackEvent('tryon_view');
        if (!sessionStorage.getItem('email_modal_shown')) {
          setTimeout(() => setShowEmailModal(true), 1200);
          sessionStorage.setItem('email_modal_shown', '1');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // 아이템별 try-on 실행 — 인자를 직접 받아서 stale closure 없음
  const doTryOn = useCallback(async (
    item: ClothingItem,
    outfitId: string,
    pUrl: string,
  ) => {
    const cacheKey = tryOnCacheKey(outfitId, item.id);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setTryOnStates((prev) => ({ ...prev, [item.id]: { status: 'ok', url: cached } }));
      return;
    }
    // StrictMode 이중 실행 방지
    if (inFlightRef.current.has(item.id)) return;
    if (!canTryOn()) {
      setTryOnStates((prev) => ({ ...prev, [item.id]: { status: 'limit_reached', url: null } }));
      return;
    }
    inFlightRef.current.add(item.id);
    setTryOnStates((prev) => ({ ...prev, [item.id]: { status: 'loading', url: null } }));

    const outcome = await generateTryOn({
      outfitId,
      personImageUrl: pUrl,
      garmentImageUrl: item.imageUrl,
      garmentDescription: item.label,
      sessionId: getSessionId(),
      itemId: item.id,
    });

    inFlightRef.current.delete(item.id);

    if (outcome.status === 'ok' && outcome.imageUrl) {
      localStorage.setItem(cacheKey, outcome.imageUrl);
      // SavedPage 표시용 최신 결과도 저장
      localStorage.setItem(tryOnDisplayKey(outfitId), outcome.imageUrl);
      setTryOnStates((prev) => ({ ...prev, [item.id]: { status: 'ok', url: outcome.imageUrl! } }));
    } else if (outcome.status === 'limit_reached') {
      setTryOnStates((prev) => ({ ...prev, [item.id]: { status: 'limit_reached', url: null } }));
    } else {
      // error → 조용히 폴백 (에러 메시지 없이 demo 이미지 표시)
      setTryOnStates((prev) => ({ ...prev, [item.id]: { status: 'error', url: null } }));
    }
  }, []); // 의존성 없음 — 인자로 받으므로

  // outfit 로드 시 localStorage 캐시만 읽음 — API 자동 호출 없음
  // 입어보기는 사용자가 칩을 탭할 때만 실행됨
  useEffect(() => {
    if (!outfit || !personUrl) return;
    const hero = findHeroItem(outfit.items);
    if (hero) setSelectedItemId(hero.id);

    const cached: Record<string, ItemTryOnState> = {};
    for (const item of outfit.items) {
      const url = localStorage.getItem(tryOnCacheKey(outfit.id, item.id));
      if (url) cached[item.id] = { status: 'ok', url };
    }
    if (Object.keys(cached).length > 0) setTryOnStates(cached);
  }, [outfit?.id, personUrl]);

  const handleItemSelect = useCallback((item: ClothingItem) => {
    if (!outfit || !personUrl) return;
    setSelectedItemId(item.id);
    if (TRYON_CAPABLE.has(item.category) && item.imageUrl) {
      void doTryOn(item, outfit.id, personUrl);
    }
  }, [outfit, personUrl, doTryOn]);

  const handleHeartClick = async () => {
    if (!outfit) return;
    const saved = await toggleSavedOutfit('demo-user-1', outfit.id);
    setIsHearted(saved);
    if (saved) {
      trackEvent('outfit_saved');
      if (!sessionStorage.getItem('email_modal_shown')) {
        setShowEmailModal(true);
        sessionStorage.setItem('email_modal_shown', '1');
      }
    }
  };

  if (loading || !outfit) {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-cream animate-pulse">
        <div className="h-16 bg-border-light" />
        <div className="mx-[18px] mt-3 rounded-card bg-border aspect-[3/4]" />
      </div>
    );
  }

  const selectedItem = outfit.items.find((i) => i.id === selectedItemId) ?? null;
  const currentState = selectedItemId ? (tryOnStates[selectedItemId] ?? null) : null;

  // 신규 사용자: 라이브 결과 → 에러 시 프리캐시 폴백
  // 데모 계정(personUrl 없음): 프리캐시 이미지 그대로
  const displayUrl = (() => {
    if (!personUrl) return outfit.tryOnImageUrl;
    if (!currentState || currentState.status === 'loading') return undefined;
    if (currentState.status === 'ok') return currentState.url ?? undefined;
    if (currentState.status === 'limit_reached') return undefined;
    return outfit.tryOnImageUrl; // error/idle → 프리캐시 폴백
  })();

  const isLoadingTryOn = personUrl ? currentState?.status === 'loading' : false;
  const fallback = currentState?.status === 'limit_reached' ? 'limit' : undefined;
  const remaining = TRYON_LIMIT - getTryOnCount();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream">
      <TopBar
        variant="detail"
        isHearted={isHearted}
        onHeartClick={handleHeartClick}
      />

      <ContextBadge context={outfit.context} />
      <TryOnView
        tryOnImageUrl={displayUrl}
        loading={isLoadingTryOn}
        fallback={fallback}
      />

      {/* 아이템 선택 UI — 실제 사용자(셀카 있음)만 */}
      {personUrl && (
        <div className="px-[18px] pt-3 pb-1">
          {/* 현재 입어본 옷 레이블 */}
          {selectedItem && TRYON_CAPABLE.has(selectedItem.category) && (
            <p className="text-[11px] text-ink-muted mb-2.5">
              지금 입어본 옷:{' '}
              <span className="font-medium text-ink">{selectedItem.label}</span>
            </p>
          )}

          {/* 아이템 칩 */}
          <div className="flex flex-wrap gap-2 mb-2">
            {outfit.items.map((item) => {
              const capable = TRYON_CAPABLE.has(item.category) && !!item.imageUrl;
              const isSelected = item.id === selectedItemId;
              const state = tryOnStates[item.id];

              if (capable) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12px] border transition-colors ${
                      isSelected
                        ? 'bg-ink text-white border-ink'
                        : 'bg-white text-ink-muted border-border active:bg-border'
                    }`}
                  >
                    {state?.status === 'loading' && (
                      <span className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin flex-shrink-0" />
                    )}
                    {state?.status === 'ok' && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-olive flex-shrink-0" />
                    )}
                    {item.label}
                  </button>
                );
              }

              // 가방·신발: 스타일링 참고 전용
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-pill text-[12px] border border-border-light text-ink-hint bg-transparent cursor-default"
                >
                  {item.label}
                  <span className="text-[10px] text-ink-hint">· 스타일링 참고</span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-ink-hint mb-1">
            AI는 한 번에 한 벌씩 입혀봐요.
            {Object.keys(tryOnStates).length === 0 && (
              <span className="text-brand"> · 탭해서 입어보기</span>
            )}
          </p>
          {remaining <= 2 && remaining > 0 && (
            <p className="text-[10px] text-brand">세션 입어보기 {remaining}회 남음</p>
          )}
        </div>
      )}

      <RationaleCTA outfitId={outfit.id} />

      <div className="flex gap-1 px-[18px] py-2.5 pb-[18px] justify-center">
        <button
          onClick={() => navigate('/')}
          className="bg-transparent border-none text-[11px] text-ink-muted py-1.5 px-1.5 font-sans cursor-pointer"
        >
          다른 추천 보기
        </button>
        <span className="text-[11px] text-[#D5C9B4] py-1.5 px-0">·</span>
        <button
          onClick={() => navigate('/wardrobe')}
          className="bg-transparent border-none text-[11px] text-ink-muted py-1.5 px-1.5 font-sans cursor-pointer"
        >
          옷장에서 고르기
        </button>
      </div>

      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        frequency={sessionStorage.getItem('closet_utm') ?? ''}
      />
    </div>
  );
}
