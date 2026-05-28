// 목업 SVG 실루엣 — mockup.html의 SVG 그대로 재현

interface TryOnSilhouetteProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'home' | 'detail' | 'mini';
}

export function TryOnSilhouette({ size = 'medium', variant = 'home' }: TryOnSilhouetteProps) {
  if (variant === 'mini') {
    return (
      <svg width="56" height="92" viewBox="0 0 200 320" aria-hidden="true">
        <ellipse cx="100" cy="38" rx="26" ry="30" fill="#F0E2CC" />
        <path d="M 74 30 Q 100 4 126 30 L 124 18 Q 100 6 76 18 Z" fill="#3D3833" />
        <rect x="90" y="62" width="20" height="14" fill="#F0E2CC" />
        <path d="M 58 84 Q 100 76 142 84 L 148 196 L 52 196 Z" fill="#E8DCC4" />
        <path d="M 58 84 L 42 170 L 52 175 L 64 90 Z" fill="#E8DCC4" />
        <path d="M 142 84 L 158 170 L 148 175 L 136 90 Z" fill="#E8DCC4" />
        <rect x="68" y="196" width="64" height="92" fill="#5A5946" />
        <ellipse cx="80" cy="294" rx="14" ry="6" fill="#8B6F47" />
        <ellipse cx="120" cy="294" rx="14" ry="6" fill="#8B6F47" />
      </svg>
    );
  }

  if (variant === 'detail') {
    return (
      <svg width="180" height="270" viewBox="0 0 200 320" aria-hidden="true">
        <ellipse cx="100" cy="38" rx="26" ry="30" fill="#F0E2CC" />
        <path d="M 74 30 Q 100 4 126 30 L 124 18 Q 100 6 76 18 Z" fill="#3D3833" />
        <rect x="90" y="62" width="20" height="14" fill="#F0E2CC" />
        <path d="M 58 84 Q 100 76 142 84 L 148 196 L 52 196 Z" fill="#E8DCC4" />
        <path d="M 58 84 L 42 170 L 52 175 L 64 90 Z" fill="#E8DCC4" />
        <path d="M 142 84 L 158 170 L 148 175 L 136 90 Z" fill="#E8DCC4" />
        <ellipse cx="44" cy="178" rx="6" ry="8" fill="#F0E2CC" />
        <ellipse cx="156" cy="178" rx="6" ry="8" fill="#F0E2CC" />
        <path d="M 138 100 Q 152 112 150 130 L 152 180 L 138 180 L 140 130 Z" fill="#C56F45" />
        <rect x="68" y="196" width="64" height="92" fill="#5A5946" />
        <line x1="100" y1="200" x2="100" y2="285" stroke="#4A4A38" strokeWidth="0.5" />
        <ellipse cx="80" cy="294" rx="14" ry="6" fill="#8B6F47" />
        <ellipse cx="120" cy="294" rx="14" ry="6" fill="#8B6F47" />
      </svg>
    );
  }

  // home variant
  const dims = size === 'large' ? { w: 140, h: 230 } : { w: 120, h: 200 };
  return (
    <svg width={dims.w} height={dims.h} viewBox="0 0 200 320" aria-hidden="true">
      <ellipse cx="100" cy="38" rx="26" ry="30" fill="#F0E2CC" />
      <path d="M 74 30 Q 100 4 126 30 L 124 18 Q 100 6 76 18 Z" fill="#3D3833" />
      <rect x="90" y="62" width="20" height="14" fill="#F0E2CC" />
      <path d="M 58 84 Q 100 76 142 84 L 148 196 L 52 196 Z" fill="#C56F45" />
      <path d="M 58 84 L 42 170 L 52 175 L 64 90 Z" fill="#C56F45" />
      <path d="M 142 84 L 158 170 L 148 175 L 136 90 Z" fill="#C56F45" />
      <rect x="68" y="196" width="64" height="92" fill="#3D3833" />
      <ellipse cx="80" cy="294" rx="14" ry="6" fill="#2A2A28" />
      <ellipse cx="120" cy="294" rx="14" ry="6" fill="#2A2A28" />
    </svg>
  );
}
