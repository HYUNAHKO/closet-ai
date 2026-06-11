import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitEmailCapture } from '../../lib/analytics';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  frequency?: string;
}

export function EmailCaptureModal({ isOpen, onClose, frequency = '' }: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    submitEmailCapture(email, bodyType, frequency);
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-[390px] bg-cream rounded-t-[24px] px-6 pt-6 pb-10 shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {submitted ? (
              <div className="py-6 text-center">
                <p className="text-[22px] mb-2">✓</p>
                <p className="font-serif text-[20px] text-ink">등록됐어요!</p>
                <p className="text-[13px] text-ink-muted mt-1">출시되면 가장 먼저 알려드릴게요</p>
              </div>
            ) : (
              <>
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                <p className="font-serif text-[20px] text-ink mb-1">출시 알림 받기</p>
                <p className="text-[13px] text-ink-muted mb-5">
                  정식 출시 때 이메일로 알려드려요. 스팸 없어요.
                </p>

                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-[12px] border border-border bg-white text-[14px] text-ink placeholder:text-ink-hint outline-none focus:border-ink transition-colors"
                  />
                  <select
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    className="w-full px-4 py-3 rounded-[12px] border border-border bg-white text-[14px] text-ink outline-none appearance-none focus:border-ink transition-colors"
                  >
                    <option value="">체형 (선택)</option>
                    <option value="slim">마른 편</option>
                    <option value="average">보통</option>
                    <option value="athletic">탄탄한 편</option>
                    <option value="curvy">통통한 편</option>
                    <option value="prefer_not">밝히지 않음</option>
                  </select>

                  <button
                    onClick={handleSubmit}
                    disabled={!email}
                    className="w-full py-3.5 bg-ink text-white rounded-[12px] text-[14px] font-medium disabled:opacity-40 transition-opacity"
                  >
                    알림 신청하기
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2 text-[13px] text-ink-muted"
                  >
                    건너뛰기
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
