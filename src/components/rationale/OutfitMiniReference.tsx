import { TryOnSilhouette } from '../home/TryOnSilhouette';
import type { ClothingItem } from '../../types';

interface OutfitMiniReferenceProps {
  /** Week 3에서 IDM-VTON 결과 이미지가 들어올 자리 */
  tryOnImageUrl?: string;
  /** 코디 구성 아이템 (색상 도트 표시용) */
  items?: ClothingItem[];
}

export function OutfitMiniReference({ tryOnImageUrl, items }: OutfitMiniReferenceProps) {
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
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
  );
}
