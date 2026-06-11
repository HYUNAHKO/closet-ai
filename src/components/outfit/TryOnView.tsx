import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TryOnSilhouette } from '../home/TryOnSilhouette';
import { TRYON_LIMIT } from '../../lib/tryOnLimit';

interface TryOnViewProps {
  tryOnImageUrl?: string;
  loading?: boolean;
  fallback?: 'limit' | 'error';
}

export function TryOnView({ tryOnImageUrl, loading, fallback }: TryOnViewProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!loading) { setElapsed(0); return; }
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => Math.min(e + 1, 25)), 1000);
    return () => clearInterval(t);
  }, [loading]);

  if (loading) {
    const remaining = Math.max(20 - elapsed, 0);
    const progress = Math.min((elapsed / 20) * 100, 100);
    return (
      <div className="flex flex-col items-center pt-2 gap-4">
        <div className="w-[260px] h-[360px] rounded-[16px] overflow-hidden relative bg-border">
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #EFE4D3 0%, #E8DFCE 100%)' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-full border-2 border-brand border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-[13px] text-ink-muted font-medium">AI가 입혀보는 중…</p>
            <p className="text-[11px] text-ink-hint">약 {remaining}초</p>
          </div>
        </div>
        <div className="w-[260px] space-y-1.5">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[10px] text-ink-hint text-center">
            체형에 맞춰 코디를 합성하고 있어요
          </p>
        </div>
      </div>
    );
  }

  if (fallback) {
    return (
      <div className="flex flex-col items-center pt-2 gap-3">
        <div className="opacity-40">
          <TryOnSilhouette variant="detail" />
        </div>
        <div className="text-center px-6">
          {fallback === 'limit' ? (
            <>
              <p className="text-[13px] text-ink-muted font-medium">
                무료 체험 {TRYON_LIMIT}회를 모두 사용했어요
              </p>
              <p className="text-[11px] text-ink-hint mt-1">
                새 세션에서 다시 체험하거나, 코디를 저장해두세요
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] text-ink-muted font-medium">
                지금 입어보기가 어려워요
              </p>
              <p className="text-[11px] text-ink-hint mt-1">
                잠시 후 다시 시도해주세요
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (tryOnImageUrl) {
    return (
      <div className="flex justify-center pt-2">
        <motion.img
          src={tryOnImageUrl}
          alt="가상 시착 결과"
          className="w-[260px] h-[360px] object-cover rounded-[16px] shadow-md"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        />
      </div>
    );
  }

  return (
    <div className="flex justify-center pt-2">
      <TryOnSilhouette variant="detail" />
    </div>
  );
}
