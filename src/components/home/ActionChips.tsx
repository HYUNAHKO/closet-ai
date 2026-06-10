import { motion } from 'framer-motion';

interface ActionChipsProps {
  onDifferentVibe?: () => void;
  onWhereToday?: () => void;
}

export function ActionChips({ onDifferentVibe, onWhereToday }: ActionChipsProps) {
  return (
    <div className="flex gap-2 px-[18px] mt-3">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onDifferentVibe}
        className="flex-1 py-[11px] bg-white border border-border rounded-pill text-[11px] text-ink font-normal"
      >
        다른 분위기 보기
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onWhereToday}
        className="flex-1 py-[11px] bg-transparent border border-border rounded-pill text-[11px] text-ink-hint font-normal"
      >
        오늘 어디 가요?
      </motion.button>
    </div>
  );
}
