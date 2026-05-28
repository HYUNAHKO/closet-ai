import type { TodayContext } from '../../types';

interface ContextLineProps {
  context: TodayContext;
}

export function ContextLine({ context }: ContextLineProps) {
  const { weather, schedule } = context;
  const weatherText = `${weather.tempMin}-${weather.tempMax}°C`;
  const scheduleText = schedule ? `${schedule.time} ${schedule.title}` : '';

  return (
    <p className="text-[12px] text-ink-muted mt-2">
      {weatherText}
      {scheduleText && (
        <>
          <span className="opacity-40 mx-1">·</span>
          {scheduleText}
        </>
      )}
    </p>
  );
}
