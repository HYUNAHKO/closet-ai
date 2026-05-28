import { useNavigate } from 'react-router-dom';

interface RationaleCTAProps {
  outfitId: string;
}

export function RationaleCTA({ outfitId }: RationaleCTAProps) {
  const navigate = useNavigate();

  return (
    <div className="px-[18px] pt-3.5">
      <button
        onClick={() => navigate(`/outfit/${outfitId}/rationale`)}
        className="w-full px-[18px] py-3.5 bg-ink text-cream border-none rounded-cta font-sans cursor-pointer flex justify-between items-center"
      >
        <div className="text-left">
          <div className="text-[14px] font-medium mb-0.5">왜 이 코디?</div>
          <div className="text-[11px] text-[#C9BFB0]">체형 · 일정 · 날씨 기준 설명</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9BFB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
