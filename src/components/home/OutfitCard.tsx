import { useNavigate } from 'react-router-dom';
import type { OutfitRecommendation } from '../../types';
import { TryOnSilhouette } from './TryOnSilhouette';

interface OutfitCardProps {
  outfit: OutfitRecommendation;
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="mx-[18px] mt-3.5 bg-white rounded-card border border-border overflow-hidden relative cursor-pointer active:opacity-90 transition-opacity"
      onClick={() => navigate(`/outfit/${outfit.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/outfit/${outfit.id}`)}
      aria-label="오늘의 코디 보기"
    >
      {/* 태그 */}
      <div className="absolute top-3.5 left-3.5 bg-cream px-2.5 py-1 rounded-pill text-[11px] text-brand font-medium">
        오늘의 코디
      </div>

      {/* 가상 착용 영역 */}
      <div className="flex justify-center pt-12 pb-3">
        <TryOnSilhouette variant="home" />
      </div>

      {/* 탭 유도 */}
      <p className="text-center text-[11px] text-ink-hint pb-4">
        탭해서 입어보기 →
      </p>
    </div>
  );
}
