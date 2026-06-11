import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { fetchClothingItems } from '../lib/api/clothing';
import { AnimatePresence, motion } from 'framer-motion';
import { analyzePose, initPoseLandmarker } from '../lib/bodyAnalysis';
import { stripBackground } from '../lib/backgroundRemoval';
import { uploadClothingImage, addClothingItem } from '../lib/api/clothing';
import { classifyClothing } from '../lib/api/vision';
import { isSupabaseAvailable } from '../lib/supabase';
import type { ClothingItem, BodyMeasurements } from '../types';

// ── 공통 상수 ─────────────────────────────────────────────────
const TOTAL_STEPS = 5;

const SHOULDER_LABELS: Record<'narrow' | 'medium' | 'wide', string> = {
  narrow: '좁은 편',
  medium: '보통',
  wide: '넓은 편',
};

const LEG_RATIO_LABELS = (r: number) => {
  if (r <= 0.50) return '짧은 편';
  if (r <= 0.60) return '보통';
  return '긴 편';
};

// ── 스텝 변환 애니메이션 ──────────────────────────────────────
const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
};

// ── 업로드 아이템 상태 ────────────────────────────────────────
interface UploadedItem {
  file: File;
  previewUrl: string;       // 로컬 object URL
  isolatedUrl: string;      // 배경 제거 후 URL (없으면 previewUrl)
  storedUrl: string;        // Supabase 업로드 결과
  classification: Partial<Omit<ClothingItem, 'id' | 'wearCount' | 'createdAt'>> | null;
  bgStatus: 'pending' | 'processing' | 'done' | 'error';
  classifyStatus: 'pending' | 'classifying' | 'done' | 'error';
}

// ─────────────────────────────────────────────────────────────
// 서브 컴포넌트들
// ─────────────────────────────────────────────────────────────

// ── Step 0: 환영 화면 ─────────────────────────────────────────
const FREQ_OPTIONS = ['0-1', '2-3', '4-5', '6+'] as const;

function StepWelcome({ onNext }: { onNext: (frequency: string) => void }) {
  const [frequency, setFrequency] = useState('');
  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream px-[22px] pt-16 pb-10">
      <div className="flex-1 flex flex-col justify-center">
        {/* 로고 영역 */}
        <div className="mb-12">
          <div className="w-14 h-14 bg-ink rounded-[16px] flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
            </svg>
          </div>
          <h1 className="font-serif text-[32px] text-ink leading-tight mb-3">
            내 옷장,<br />제대로 입히기
          </h1>
          <p className="text-[15px] text-ink-muted leading-relaxed">
            셀카 1장 + 가장 자주 입는 옷 10벌로<br />
            내 체형에 맞는 코디를 매일 추천받아요.
          </p>
        </div>

        {/* 포인트 3개 */}
        <div className="space-y-4 mb-12">
          {[
            { icon: '📸', title: '셀카 1장으로 체형 분석', desc: 'AI가 어깨·다리 비율을 자동으로 측정' },
            { icon: '👗', title: '10벌 챌린지', desc: '전체 옷장 등록 X — 자주 입는 10벌만' },
            { icon: '✨', title: '내 체형에 입혀보기', desc: 'IDM-VTON으로 실제 내 몸에 코디 합성' },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 items-start">
              <span className="text-[22px] leading-none mt-0.5">{item.icon}</span>
              <div>
                <p className="text-[14px] font-medium text-ink">{item.title}</p>
                <p className="text-[12px] text-ink-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* frequency 질문 */}
      <div className="mb-6">
        <p className="text-[13px] text-ink-muted mb-3">일주일에 몇 번 "뭐 입지?" 고민하세요?</p>
        <div className="flex gap-2 flex-wrap">
          {FREQ_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFrequency(opt)}
              className={`px-4 py-2 rounded-pill text-[13px] font-medium border transition-colors ${
                frequency === opt
                  ? 'bg-ink text-white border-ink'
                  : 'bg-transparent text-ink-muted border-border'
              }`}
            >
              주 {opt}회
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onNext(frequency)}
          className="w-full py-4 bg-ink text-white rounded-cta text-[15px] font-medium"
        >
          챌린지 시작하기
        </motion.button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full py-3 text-[13px] text-ink-muted"
        >
          이미 계정이 있어요
        </button>
      </div>
    </div>
  );
}

// ── Step 1: 셀카 업로드 + 체형 분석 ───────────────────────────
interface StepSelfieProps {
  onNext: (measurements: BodyMeasurements) => void;
}

function StepSelfie({ onNext }: StepSelfieProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading-model' | 'analyzing' | 'done' | 'error'>('idle');
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);

  const handleFile = useCallback(async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setStatus('loading-model');

    try {
      // MediaPipe 초기화 (첫 호출 시 CDN에서 WASM 로드)
      await initPoseLandmarker();
      setStatus('analyzing');

      // 이미지 로드
      const img = new Image();
      img.src = objectUrl;
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('image load failed'));
      });

      const result = await analyzePose(img);
      if (result) {
        setMeasurements(result);
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }, []);

  const handleSkip = () => {
    // 기본값으로 다음 단계 진행
    onNext({ shoulderWidth: 'medium', waistRatio: 0.72, legRatio: 0.55 });
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream px-[22px] pt-14 pb-10">
      <h2 className="font-serif text-[24px] text-ink mb-1">셀카를 올려주세요</h2>
      <p className="text-[13px] text-ink-muted mb-8">AI가 어깨·다리 비율을 자동으로 측정해요</p>

      {/* 업로드 / 미리보기 */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {preview ? (
          <div className="relative w-[200px] h-[280px] rounded-[20px] overflow-hidden border border-border shadow-md">
            <img src={preview} alt="셀카" className="w-full h-full object-cover" />
            {(status === 'loading-model' || status === 'analyzing') && (
              <div className="absolute inset-0 bg-ink/60 flex flex-col items-center justify-center gap-2">
                <PulseRing />
                <p className="text-white text-[12px]">
                  {status === 'loading-model' ? 'AI 모델 로딩 중…' : '체형 분석 중…'}
                </p>
              </div>
            )}
            {status === 'done' && measurements && (
              <div className="absolute bottom-0 left-0 right-0 bg-ink/80 px-3 py-2.5">
                <p className="text-white text-[11px] text-center">분석 완료 ✓</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-4 items-start">
            {/* 예시 포즈 */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-[88px] h-[120px] rounded-[14px] bg-oat/60 border border-border flex items-center justify-center">
                <svg width="40" height="80" viewBox="0 0 40 80" fill="none">
                  <circle cx="20" cy="9" r="7" fill="#2A2A28" opacity="0.15"/>
                  <line x1="20" y1="16" x2="20" y2="48" stroke="#2A2A28" strokeWidth="3" strokeLinecap="round" opacity="0.2"/>
                  <line x1="20" y1="24" x2="6" y2="36" stroke="#2A2A28" strokeWidth="2.5" strokeLinecap="round" opacity="0.2"/>
                  <line x1="20" y1="24" x2="34" y2="36" stroke="#2A2A28" strokeWidth="2.5" strokeLinecap="round" opacity="0.2"/>
                  <line x1="20" y1="48" x2="13" y2="70" stroke="#2A2A28" strokeWidth="2.5" strokeLinecap="round" opacity="0.2"/>
                  <line x1="20" y1="48" x2="27" y2="70" stroke="#2A2A28" strokeWidth="2.5" strokeLinecap="round" opacity="0.2"/>
                </svg>
              </div>
              <p className="text-[10px] text-ink-hint text-center leading-tight">정면 전신<br />배경 단순하게</p>
            </div>

            {/* 업로드 버튼 */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-[200px] h-[280px] rounded-[20px] border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-ink-hint"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="10" r="3" />
                <path d="M6.17 18.74A6 6 0 0 1 12 16a6 6 0 0 1 5.83 2.74" />
              </svg>
              <span className="text-[13px]">사진 선택</span>
            </button>
          </div>
        )}

        {/* 프라이버시 안심 문구 */}
        <div className="flex items-center gap-1.5 mt-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-ink-hint flex-shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <p className="text-[11px] text-ink-hint">본인만 볼 수 있게 저장돼요</p>
        </div>

        {status === 'error' && (
          <p className="text-[12px] text-brand text-center">
            자동 분석이 어려웠어요.<br />다음 단계에서 직접 입력할 수 있어요.
          </p>
        )}

        {status === 'done' && measurements && (
          <div className="w-full space-y-2">
            {[
              { label: '어깨', value: SHOULDER_LABELS[measurements.shoulderWidth] },
              { label: '다리 비율', value: LEG_RATIO_LABELS(measurements.legRatio) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between bg-white rounded-[12px] px-4 py-3 border border-border">
                <span className="text-[13px] text-ink-muted">{label}</span>
                <span className="text-[13px] font-medium text-ink">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="space-y-3 mt-6">
        {status === 'done' && measurements ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNext(measurements)}
            className="w-full py-4 bg-ink text-white rounded-cta text-[15px] font-medium"
          >
            계속하기
          </motion.button>
        ) : (
          preview && status !== 'loading-model' && status !== 'analyzing' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => fileRef.current?.click()}
              className="w-full py-4 bg-ink text-white rounded-cta text-[15px] font-medium"
            >
              다른 사진으로 다시 시도
            </motion.button>
          )
        )}
        <button
          onClick={handleSkip}
          className="w-full py-3 text-[13px] text-ink-muted"
        >
          건너뛰고 직접 입력하기
        </button>
      </div>
    </div>
  );
}

// ── Step 2: 체형 확인 + 슬라이더 미세조정 ─────────────────────
interface StepBodyConfirmProps {
  initial: BodyMeasurements;
  onNext: (measurements: BodyMeasurements) => void;
}

function StepBodyConfirm({ initial, onNext }: StepBodyConfirmProps) {
  const [shoulder, setShoulder] = useState(initial.shoulderWidth);
  const [legRatio, setLegRatio] = useState(initial.legRatio);

  const legLabel = LEG_RATIO_LABELS(legRatio);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream px-[22px] pt-14 pb-10">
      <h2 className="font-serif text-[24px] text-ink mb-1">체형을 확인해주세요</h2>
      <p className="text-[13px] text-ink-muted mb-8">AI가 자동으로 측정했어요. 다르면 조정하세요.</p>

      <div className="flex-1 space-y-6">
        {/* 어깨 너비 */}
        <div className="bg-white rounded-[16px] border border-border p-5">
          <p className="text-[12px] text-ink-hint mb-3">어깨 너비</p>
          <div className="grid grid-cols-3 gap-2">
            {(['narrow', 'medium', 'wide'] as const).map((val) => (
              <button
                key={val}
                onClick={() => setShoulder(val)}
                className={`py-2.5 rounded-[10px] text-[13px] border transition-colors ${
                  shoulder === val
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink-muted border-border'
                }`}
              >
                {SHOULDER_LABELS[val]}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-[11px] text-ink-hint">
            <span>좁은 어깨 → 드롭숄더로 보완</span>
            <span>넓은 어깨 → V넥으로 강조</span>
          </div>
        </div>

        {/* 다리 비율 */}
        <div className="bg-white rounded-[16px] border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] text-ink-hint">다리 비율</p>
            <span className="text-[13px] font-medium text-ink">{legLabel}</span>
          </div>
          <input
            type="range"
            min={40}
            max={70}
            value={Math.round(legRatio * 100)}
            onChange={(e) => setLegRatio(Number(e.target.value) / 100)}
            className="w-full accent-ink"
          />
          <div className="flex justify-between text-[11px] text-ink-hint mt-1">
            <span>짧은 편</span>
            <span>보통</span>
            <span>긴 편</span>
          </div>
          <div className="mt-4 text-[11px] text-ink-hint">
            {legRatio > 0.60
              ? '긴 다리 비율 → 하이웨이스트 스타일 추천'
              : legRatio <= 0.50
              ? '짧은 다리 → 세로줄 패턴으로 시각 효과'
              : '평균 비율 → 밸런스 잡힌 코디 구성'}
          </div>
        </div>

        {/* 체형 요약 */}
        <div className="bg-oat/40 rounded-[16px] p-4 border border-border-light">
          <p className="text-[12px] text-ink-muted mb-2">이 체형 기준으로 코디가 추천돼요</p>
          <p className="text-[13px] text-ink">
            어깨 <strong>{SHOULDER_LABELS[shoulder]}</strong>,
            {' '}다리 <strong>{legLabel}</strong>
          </p>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onNext({ shoulderWidth: shoulder, waistRatio: initial.waistRatio, legRatio })}
        className="w-full py-4 bg-ink text-white rounded-cta text-[15px] font-medium mt-6"
      >
        확정하고 계속하기
      </motion.button>
    </div>
  );
}

// ── Step 3: 옷 10벌 업로드 ────────────────────────────────────
interface StepClothesProps {
  onNext: (items: UploadedItem[]) => void;
}

const MAX_CLOTHES = 10;

function StepClothes({ onNext }: StepClothesProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const loadDemoClothes = async () => {
    setLoadingDemo(true);
    try {
      const clothes = await fetchClothingItems('demo-user-1');
      const candidates = clothes.filter((c) => c.isolatedImageUrl);
      const selected = (candidates.length >= 5 ? candidates : clothes).slice(0, 8);
      const dummyFile = new File([''], 'demo.jpg', { type: 'image/jpeg' });
      setItems(selected.map((c) => ({
        file: dummyFile,
        previewUrl: c.isolatedImageUrl || c.imageUrl,
        isolatedUrl: c.isolatedImageUrl || c.imageUrl,
        storedUrl: c.imageUrl,
        classification: {
          ownerId: 'demo-user-1',
          category: c.category,
          label: c.label,
          imageUrl: c.imageUrl,
          isolatedImageUrl: c.isolatedImageUrl,
          colorHex: c.colorHex,
          attributes: c.attributes,
        },
        bgStatus: 'done' as const,
        classifyStatus: 'done' as const,
      })));
    } finally {
      setLoadingDemo(false);
    }
  };

  const processFile = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file);

    const newItem: UploadedItem = {
      file,
      previewUrl,
      isolatedUrl: previewUrl,
      storedUrl: '',
      classification: null,
      bgStatus: 'pending',
      classifyStatus: 'pending',
    };

    setItems((prev) => {
      if (prev.length >= MAX_CLOTHES) return prev;
      return [...prev, newItem];
    });

    const idx = items.length; // capture index before async

    // 배경 제거 (병렬)
    const bgPromise = stripBackground(file).then((url) => {
      setItems((prev) =>
        prev.map((it, i) =>
          i === idx
            ? { ...it, isolatedUrl: url ?? previewUrl, bgStatus: url ? 'done' : 'error' }
            : it
        )
      );
      return url ?? previewUrl;
    });

    // Supabase 업로드 + classify (bgRemoval 완료 후 또는 병렬)
    bgPromise.then(async () => {
      if (!isSupabaseAvailable) {
        setItems((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, classifyStatus: 'error' } : it))
        );
        return;
      }

      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, classifyStatus: 'classifying' } : it))
      );

      const uploadedUrl = await uploadClothingImage('demo-user-1', file);
      if (!uploadedUrl) {
        setItems((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, classifyStatus: 'error' } : it))
        );
        return;
      }

      const cls = await classifyClothing(uploadedUrl);
      setItems((prev) =>
        prev.map((it, i) =>
          i === idx
            ? {
                ...it,
                storedUrl: uploadedUrl,
                classification: cls
                  ? {
                      ownerId: 'demo-user-1',
                      category: cls.category,
                      label: cls.label,
                      imageUrl: uploadedUrl,
                      isolatedImageUrl: uploadedUrl,
                      colorHex: cls.colorHex,
                      attributes: {
                        material: cls.material,
                        style: cls.style,
                        season: cls.season,
                      },
                    }
                  : null,
                classifyStatus: cls ? 'done' : 'error',
              }
            : it
        )
      );
    });
  }, [items.length]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_CLOTHES - items.length);
    files.forEach((f) => processFile(f));
    e.target.value = '';
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const doneCount = items.filter((i) => i.classifyStatus === 'done' || !isSupabaseAvailable).length;
  const canProceed = items.length >= 3;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream px-[22px] pt-14 pb-10">
      <h2 className="font-serif text-[24px] text-ink mb-1">자주 입는 옷 10벌</h2>
      <p className="text-[13px] text-ink-muted mb-3">
        전체 옷장 X — 가장 자주 입는 것만
      </p>

      {items.length === 0 && (
        <button
          onClick={loadDemoClothes}
          disabled={loadingDemo}
          className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-pill border border-brand text-brand text-[13px] font-medium disabled:opacity-50 self-start"
        >
          {loadingDemo ? (
            <span className="w-3 h-3 border border-brand border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          )}
          예시 옷으로 시작
        </button>
      )}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-ink rounded-full transition-all"
            style={{ width: `${(items.length / MAX_CLOTHES) * 100}%` }}
          />
        </div>
        <span className="text-[12px] text-ink-muted w-12 text-right">
          {items.length}/{MAX_CLOTHES}
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {/* 그리드 */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {items.map((item, idx) => (
            <div key={idx} className="relative aspect-square rounded-[12px] overflow-hidden border border-border bg-white">
              <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />

              {/* 배경 제거 / 분류 상태 오버레이 */}
              {(item.bgStatus === 'processing' || item.classifyStatus === 'classifying') && (
                <div className="absolute inset-0 bg-ink/50 flex items-center justify-center">
                  <PulseRing size={20} />
                </div>
              )}
              {item.classifyStatus === 'done' && (
                <div className="absolute bottom-0 left-0 right-0 bg-ink/70 px-1.5 py-1">
                  <p className="text-white text-[9px] truncate">
                    {(item.classification as { label?: string })?.label ?? '분류 완료'}
                  </p>
                </div>
              )}

              {/* 삭제 버튼 */}
              <button
                onClick={() => removeItem(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/80 flex items-center justify-center"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#2A2A28" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}

          {/* 추가 슬롯 */}
          {items.length < MAX_CLOTHES && (
            <button
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-[12px] border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-ink-hint"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-[9px]">추가</span>
            </button>
          )}
        </div>

        {isSupabaseAvailable && doneCount > 0 && (
          <p className="text-[11px] text-olive text-center">
            {doneCount}벌 AI 분류 완료
          </p>
        )}
        {!isSupabaseAvailable && items.length > 0 && (
          <p className="text-[11px] text-ink-muted text-center">
            Supabase 미연결 — 나중에 옷장에서 추가할 수 있어요
          </p>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onNext(items)}
        disabled={!canProceed}
        className="w-full py-4 bg-ink text-white rounded-cta text-[15px] font-medium disabled:opacity-40 mt-4"
      >
        {items.length < 3 ? `${3 - items.length}벌 더 추가해주세요` : '분류 결과 확인하기'}
      </motion.button>
    </div>
  );
}

// ── Step 4: 분류 결과 확인 ────────────────────────────────────
interface StepReviewProps {
  items: UploadedItem[];
  onDone: () => void;
}

const CATEGORY_LABELS: Record<ClothingItem['category'], string> = {
  top: '상의', bottom: '하의', shoes: '신발',
  bag: '가방', outerwear: '아우터', dress: '원피스',
};

function StepReview({ items, onDone }: StepReviewProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (isSupabaseAvailable) {
      const promises = items.map((item) => {
        if (item.classification && item.storedUrl) {
          return addClothingItem({
            ownerId: 'demo-user-1',
            category: (item.classification as { category?: ClothingItem['category'] }).category ?? 'top',
            label: (item.classification as { label?: string }).label ?? '미분류',
            imageUrl: item.storedUrl,
            isolatedImageUrl: item.isolatedUrl !== item.previewUrl ? item.isolatedUrl : item.storedUrl,
            colorHex: (item.classification as { colorHex?: string }).colorHex ?? '#888888',
            attributes: (item.classification as { attributes?: ClothingItem['attributes'] }).attributes ?? {},
          });
        }
        return Promise.resolve(null);
      });
      await Promise.all(promises);
    }
    setSaving(false);
    onDone();
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream px-[22px] pt-14 pb-10">
      <h2 className="font-serif text-[24px] text-ink mb-1">AI가 분류했어요</h2>
      <p className="text-[13px] text-ink-muted mb-6">확인 후 저장하면 코디 추천이 시작돼요</p>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {items.map((item, idx) => {
            const cls = item.classification as {
              label?: string;
              category?: ClothingItem['category'];
              colorHex?: string;
            } | null;
            return (
              <div key={idx} className="flex items-center gap-3 bg-white rounded-[14px] border border-border px-3 py-2.5">
                <div className="w-12 h-12 rounded-[10px] overflow-hidden flex-shrink-0 border border-border-light">
                  <img src={item.isolatedUrl || item.previewUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  {item.classifyStatus === 'done' && cls ? (
                    <>
                      <p className="text-[13px] font-medium text-ink truncate">{cls.label ?? '미분류'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {cls.colorHex && (
                          <span className="w-3 h-3 rounded-full border border-border-light" style={{ background: cls.colorHex }} />
                        )}
                        <span className="text-[11px] text-ink-muted">
                          {cls.category ? CATEGORY_LABELS[cls.category] : '미분류'}
                        </span>
                      </div>
                    </>
                  ) : item.classifyStatus === 'classifying' ? (
                    <p className="text-[12px] text-ink-muted">분류 중…</p>
                  ) : (
                    <p className="text-[12px] text-ink-muted">분류 필요 (직접 입력)</p>
                  )}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  item.classifyStatus === 'done' ? 'bg-olive' :
                  item.classifyStatus === 'classifying' ? 'bg-oat animate-pulse' : 'bg-border'
                }`} />
              </div>
            );
          })}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-ink text-white rounded-cta text-[15px] font-medium disabled:opacity-60 mt-6"
      >
        {saving ? '저장 중…' : '저장하고 첫 코디 보기 →'}
      </motion.button>
    </div>
  );
}

// ── 공용: 맥박 로딩 링 ────────────────────────────────────────
function PulseRing({ size = 32 }: { size?: number }) {
  return (
    <motion.div
      className="rounded-full border-2 border-white"
      style={{ width: size, height: size }}
      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.2, repeat: Infinity }}
    />
  );
}

// ── 상단 진행 바 ──────────────────────────────────────────────
function ProgressHeader({ step, total, onBack }: { step: number; total: number; onBack: () => void }) {
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-50 bg-cream px-4 pt-10 pb-3">
      <div className="flex items-center gap-3">
        {step > 0 && (
          <button onClick={onBack} className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A28" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-ink rounded-full"
            animate={{ width: `${((step + 1) / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-[11px] text-ink-muted w-10 text-right flex-shrink-0">
          {step + 1}/{total}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OnboardingPage — 메인 위자드 컨트롤러
// ─────────────────────────────────────────────────────────────
export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    shoulderWidth: 'medium',
    waistRatio: 0.72,
    legRatio: 0.55,
  });
  const [uploadedItems, setUploadedItems] = useState<UploadedItem[]>([]);

  const goNext = () => { setDir(1); setStep((s) => s + 1); };

  const handleWelcomeNext = (frequency: string) => {
    trackEvent('onboard_start', frequency);
    setDir(1);
    setStep(1);
  };
  const goBack = () => { setDir(-1); setStep((s) => Math.max(0, s - 1)); };

  const handleSelfieNext = (m: BodyMeasurements) => {
    setMeasurements(m);
    goNext();
  };

  const handleBodyConfirmNext = (m: BodyMeasurements) => {
    setMeasurements(m);
    goNext();
  };

  const handleClothesNext = (items: UploadedItem[]) => {
    setUploadedItems(items);
    goNext();
  };

  const handleDone = () => {
    navigate('/', { replace: true });
  };

  return (
    <>
      {step > 0 && (
        <ProgressHeader step={step - 1} total={TOTAL_STEPS - 1} onBack={goBack} />
      )}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {step === 0 && <StepWelcome onNext={handleWelcomeNext} />}
          {step === 1 && <StepSelfie onNext={handleSelfieNext} />}
          {step === 2 && (
            <StepBodyConfirm initial={measurements} onNext={handleBodyConfirmNext} />
          )}
          {step === 3 && <StepClothes onNext={handleClothesNext} />}
          {step === 4 && (
            <StepReview items={uploadedItems} onDone={handleDone} />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
