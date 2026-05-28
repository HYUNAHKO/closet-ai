import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  variant?: 'home' | 'detail' | 'rationale' | 'wardrobe';
  onHeartClick?: () => void;
  isHearted?: boolean;
  title?: string;
}

export function TopBar({ variant = 'home', onHeartClick, isHearted = false, title }: TopBarProps) {
  const navigate = useNavigate();

  if (variant === 'home') {
    return (
      <div className="flex justify-between items-center px-[22px] pt-3 pb-1 text-[11px] text-ink-hint">
        <span>9:41</span>
        <span>•••</span>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <>
        <div className="flex justify-between items-center px-[22px] pt-3 pb-1 text-[11px] text-ink-hint">
          <span>9:41</span>
          <span>•••</span>
        </div>
        <div className="flex justify-between items-center px-4 py-1.5">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5"
            aria-label="뒤로 가기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            onClick={onHeartClick}
            className="p-1.5 -mr-1.5"
            aria-label="저장"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isHearted ? '#C56F45' : 'none'} stroke={isHearted ? '#C56F45' : '#2A2A28'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </>
    );
  }

  if (variant === 'wardrobe') {
    return (
      <>
        <div className="flex justify-between items-center px-[22px] pt-3 pb-1 text-[11px] text-ink-hint">
          <span>9:41</span>
          <span>•••</span>
        </div>
        <div className="flex justify-between items-center px-4 py-1.5">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5"
            aria-label="뒤로 가기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="text-[13px] font-medium text-ink">{title ?? '내 옷장'}</span>
          <div className="w-8" />
        </div>
      </>
    );
  }

  // rationale
  return (
    <>
      <div className="flex justify-between items-center px-[22px] pt-3 pb-1 text-[11px] text-ink-hint">
        <span>9:41</span>
        <span>•••</span>
      </div>
      <div className="flex justify-between items-center px-4 py-1.5">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 -ml-1.5"
          aria-label="뒤로 가기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="text-[11px] text-ink-hint">스타일 분석</span>
        <div className="w-8" />
      </div>
    </>
  );
}
