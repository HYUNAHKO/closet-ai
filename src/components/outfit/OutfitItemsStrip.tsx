import type { ClothingItem } from '../../types';

interface OutfitItemsStripProps {
  items: ClothingItem[];
}

// 카테고리별 간단한 SVG 썸네일
function ItemThumb({ item }: { item: ClothingItem }) {
  const svgByCategory: Record<string, React.ReactNode> = {
    top: (
      <svg width="30" height="30" viewBox="0 0 40 40">
        <path d="M 8 12 Q 20 8 32 12 L 34 32 L 6 32 Z" fill={item.colorHex} />
      </svg>
    ),
    bottom: (
      <svg width="30" height="30" viewBox="0 0 40 40">
        <rect x="14" y="6" width="12" height="28" fill={item.colorHex} />
      </svg>
    ),
    shoes: (
      <svg width="30" height="30" viewBox="0 0 40 40">
        <ellipse cx="20" cy="22" rx="14" ry="8" fill={item.colorHex} />
      </svg>
    ),
    bag: (
      <svg width="30" height="30" viewBox="0 0 40 40">
        <rect x="10" y="14" width="20" height="18" rx="2" fill={item.colorHex} />
        <path d="M 14 14 Q 14 8 20 8 Q 26 8 26 14" stroke={item.colorHex} strokeWidth="1.5" fill="none" />
      </svg>
    ),
    outerwear: (
      <svg width="30" height="30" viewBox="0 0 40 40">
        <path d="M 6 10 L 14 8 L 20 12 L 26 8 L 34 10 L 36 32 L 4 32 Z" fill={item.colorHex} />
      </svg>
    ),
    dress: (
      <svg width="30" height="30" viewBox="0 0 40 40">
        <path d="M 14 4 L 26 4 L 32 32 L 8 32 Z" fill={item.colorHex} />
      </svg>
    ),
  };

  return (
    <div className="w-[54px] h-[54px] bg-white rounded-xl border border-border flex items-center justify-center">
      {svgByCategory[item.category] ?? (
        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: item.colorHex }} />
      )}
    </div>
  );
}

export function OutfitItemsStrip({ items }: OutfitItemsStripProps) {
  return (
    <div className="flex gap-2 px-[18px] pt-2 justify-center">
      {items.slice(0, 4).map((item) => (
        <ItemThumb key={item.id} item={item} />
      ))}
    </div>
  );
}
