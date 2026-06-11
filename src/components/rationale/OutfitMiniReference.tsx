import { TryOnSilhouette } from '../home/TryOnSilhouette';
import type { ClothingItem } from '../../types';

const CATEGORY_KO: Partial<Record<ClothingItem['category'], string>> = {
  top: '상의', bottom: '하의', outerwear: '아우터', dress: '원피스',
};

interface OutfitMiniReferenceProps {
  tryOnImageUrl?: string;
  items?: ClothingItem[];
  /** 사용자 본인 try-on일 때 표시할 아이템 */
  heroItem?: ClothingItem | null;
}

export function OutfitMiniReference({ tryOnImageUrl, items, heroItem }: OutfitMiniReferenceProps) {
  const catLabel = heroItem ? (CATEGORY_KO[heroItem.category] ?? heroItem.category) : null;

  return (
    <div className="flex flex-col items-center gap-1.5 pt-2">
      <div className="flex items-center justify-center gap-3">
        {tryOnImageUrl ? (
          <img
            src={tryOnImageUrl}
            alt="코디 참조"
            className="w-[60px] h-[80px] object-cover rounded-[10px] shadow-sm"
          />
        ) : (
          <TryOnSilhouette variant="mini" />
        )}

        {/* 아이템 색상 도트 */}
        {items && items.length > 0 && (
          <div className="flex gap-1.5">
            {items.slice(0, 4).map((item) => (
              <span
                key={item.id}
                className="w-4 h-4 rounded-full border border-border shadow-sm flex-shrink-0"
                style={{ background: item.colorHex }}
                title={item.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* 사용자 try-on일 때만: 어떤 옷을 입었는지 + 이미지 범위 안내 */}
      {heroItem && catLabel && (
        <div className="text-center space-y-0.5">
          <p className="text-[11px] text-ink-muted">
            {catLabel} <span className="font-medium text-ink">'{heroItem.label}'</span>을 입은 모습
          </p>
          <p className="text-[10px] text-ink-hint">이미지는 한 벌 기준 · 설명은 코디 전체예요</p>
        </div>
      )}
    </div>
  );
}
