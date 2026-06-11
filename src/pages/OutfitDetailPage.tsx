import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { TopBar } from '../components/shared/TopBar';
import { ContextBadge } from '../components/outfit/ContextBadge';
import { TryOnView } from '../components/outfit/TryOnView';
import { OutfitItemsStrip } from '../components/outfit/OutfitItemsStrip';
import { RationaleCTA } from '../components/outfit/RationaleCTA';
import { EmailCaptureModal } from '../components/shared/EmailCaptureModal';
import { fetchRecommendationById, toggleSavedOutfit } from '../lib/api/recommendations';
import { generateTryOn } from '../lib/api/virtualTryOn';
import { canTryOn } from '../lib/tryOnLimit';
import { isSupabaseAvailable } from '../lib/supabase';
import type { OutfitRecommendation } from '../types';

const DEMO_PERSON_URL = import.meta.env.VITE_DEMO_PERSON_IMAGE_URL as string | undefined;

type LiveStatus = 'idle' | 'loading' | 'ok' | 'limit_reached' | 'error';

export function OutfitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState<OutfitRecommendation | null>(null);
  const [isHearted, setIsHearted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [liveTryOnUrl, setLiveTryOnUrl] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('idle');

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

  // 프리캐시 없을 때 라이브 try-on 시도 (세션당 최대 3회)
  useEffect(() => {
    if (!outfit || outfit.tryOnImageUrl || !isSupabaseAvailable || !DEMO_PERSON_URL) return;

    const garment = outfit.items.find((item) => item.imageUrl);
    if (!garment) return;

    if (!canTryOn()) {
      setLiveStatus('limit_reached');
      return;
    }

    let cancelled = false;
    setLiveStatus('loading');

    generateTryOn({
      outfitId: outfit.id,
      personImageUrl: DEMO_PERSON_URL,
      garmentImageUrl: garment.imageUrl,
      garmentDescription: garment.label,
    }).then((outcome) => {
      if (cancelled) return;
      if (outcome.status === 'ok' && outcome.imageUrl) {
        setLiveTryOnUrl(outcome.imageUrl);
      }
      setLiveStatus(outcome.status);
    });

    return () => { cancelled = true; };
  }, [outfit]);

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

  const fallback =
    liveStatus === 'limit_reached' ? 'limit' :
    liveStatus === 'error' ? 'error' :
    undefined;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream">
      <TopBar
        variant="detail"
        isHearted={isHearted}
        onHeartClick={handleHeartClick}
      />

      <ContextBadge context={outfit.context} />
      <TryOnView
        tryOnImageUrl={liveTryOnUrl ?? outfit.tryOnImageUrl}
        loading={liveStatus === 'loading'}
        fallback={fallback}
      />
      <OutfitItemsStrip items={outfit.items} />
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
