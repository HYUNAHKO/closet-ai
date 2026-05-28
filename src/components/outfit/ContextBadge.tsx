import type { TodayContext } from '../../types';

interface ContextBadgeProps {
  context: TodayContext;
}

export function ContextBadge({ context }: ContextBadgeProps) {
  const scheduleLabel = context.schedule
    ? `${context.schedule.time} ${context.schedule.title}`
    : null;

  return (
    <div className="flex items-center gap-2 px-[22px] pt-1">
      {/* 체형 기준 pill — 차별점 명시 장치 */}
      <span className="text-[11px] text-brand px-2.5 py-[3px] bg-white border border-[#EFD9C2] rounded-pill flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C56F45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        당신의 체형 기준
      </span>
      {scheduleLabel && (
        <span className="text-[11px] text-ink-hint">{scheduleLabel}</span>
      )}
    </div>
  );
}
