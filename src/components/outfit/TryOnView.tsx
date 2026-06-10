import { motion } from 'framer-motion';
import { TryOnSilhouette } from '../home/TryOnSilhouette';

interface TryOnViewProps {
  tryOnImageUrl?: string;
  loading?: boolean;
}

export function TryOnView({ tryOnImageUrl, loading }: TryOnViewProps) {
  if (loading) {
    return (
      <div className="flex justify-center pt-2">
        <div className="w-[260px] h-[360px] rounded-[16px] overflow-hidden relative">
          <motion.div
            className="absolute inset-0 bg-border rounded-[16px]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-full border-2 border-ink-muted"
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <p className="text-[12px] text-ink-muted">코디 생성 중…</p>
          </div>
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
