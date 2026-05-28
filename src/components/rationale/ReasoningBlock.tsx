type BlockType = 'body' | 'schedule' | 'weather';

interface ReasoningBlockProps {
  type: BlockType;
  text: string;
  isLast?: boolean;
}

const BLOCK_CONFIG: Record<BlockType, { label: string; icon: React.ReactNode }> = {
  body: {
    label: '체형',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C56F45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  schedule: {
    label: '일정',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C56F45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  weather: {
    label: '날씨',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C56F45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
  },
};

export function ReasoningBlock({ type, text, isLast = false }: ReasoningBlockProps) {
  const { label, icon } = BLOCK_CONFIG[type];

  return (
    <div className={`${!isLast ? 'pb-3 mb-3 border-b border-border-light' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] text-brand font-medium tracking-wide">{label}</span>
      </div>
      <p className="text-[12px] text-dark leading-[1.7] m-0">{text}</p>
    </div>
  );
}
