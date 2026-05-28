import { useState, useEffect } from 'react';
import { TopBar } from '../components/shared/TopBar';
import { BottomNav } from '../components/shared/BottomNav';
import { fetchClothingItems, addClothingItem, deleteClothingItem } from '../lib/api/clothing';
import { isSupabaseAvailable } from '../lib/supabase';
import type { ClothingItem } from '../types';

// 카테고리 한글 레이블 & 필터 탭 목록
const CATEGORY_LABELS: Record<ClothingItem['category'], string> = {
  top: '상의',
  bottom: '하의',
  shoes: '신발',
  bag: '가방',
  outerwear: '아우터',
  dress: '원피스',
};
const ALL_CATEGORIES: (ClothingItem['category'] | 'all')[] = [
  'all', 'top', 'bottom', 'outerwear', 'shoes', 'bag', 'dress',
];

// ── 카테고리별 아이콘 (SVG 문자열) ─────────────────────────
function CategoryDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
      style={{ background: color }}
    />
  );
}

// ── 옷 카드 ────────────────────────────────────────────────
interface ClothingCardProps {
  item: ClothingItem;
  onDelete: (id: string) => void;
}

function ClothingCard({ item, onDelete }: ClothingCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-white rounded-card border border-border overflow-hidden flex flex-col">
      {/* 이미지 영역 */}
      <div
        className="relative w-full aspect-[3/4] flex items-center justify-center"
        style={{ background: `${item.colorHex}22` }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.label}
            className="w-full h-full object-cover"
          />
        ) : (
          /* placeholder: 색상 원 + 카테고리 */
          <div className="flex flex-col items-center gap-2">
            <span
              className="w-10 h-10 rounded-full shadow-sm"
              style={{ background: item.colorHex }}
            />
            <span className="text-[10px] text-ink-hint">
              {CATEGORY_LABELS[item.category]}
            </span>
          </div>
        )}

        {/* 삭제 버튼 */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow-sm"
            aria-label="삭제"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B6359" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <div className="absolute inset-0 bg-ink/60 flex flex-col items-center justify-center gap-2 px-2">
            <p className="text-white text-[11px] text-center">정말 삭제할까요?</p>
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(item.id)}
                className="px-3 py-1 bg-brand text-white text-[11px] rounded-pill"
              >
                삭제
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 bg-white/90 text-ink text-[11px] rounded-pill"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div className="px-3 py-2.5 flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <CategoryDot color={item.colorHex} />
          <span className="text-[12px] font-medium text-ink truncate leading-tight">
            {item.label}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-ink-hint">
            {CATEGORY_LABELS[item.category]}
          </span>
          <span className="text-[10px] text-ink-hint">
            {item.wearCount}회 착용
          </span>
        </div>
        {item.attributes.season && item.attributes.season.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-0.5">
            {item.attributes.season.map((s) => (
              <span
                key={s}
                className="text-[9px] px-1.5 py-0.5 rounded-pill bg-cream text-ink-hint border border-border-light"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 옷 추가 모달 ───────────────────────────────────────────
interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: Omit<ClothingItem, 'id' | 'wearCount' | 'createdAt'>) => Promise<void>;
}

function AddItemModal({ onClose, onAdd }: AddItemModalProps) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<ClothingItem['category']>('top');
  const [colorHex, setColorHex] = useState('#C56F45');
  const [material, setMaterial] = useState('');
  const [style, setStyle] = useState('');
  const [season, setSeason] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const seasonOptions = ['봄', '여름', '가을', '겨울'];

  const handleSeasonToggle = (s: string) => {
    setSeason((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async () => {
    if (!label.trim()) return;
    setSaving(true);
    await onAdd({
      ownerId: 'demo-user-1',
      category,
      label: label.trim(),
      imageUrl: '',
      isolatedImageUrl: '',
      colorHex,
      attributes: {
        material: material || undefined,
        style: style || undefined,
        season: season.length ? season : undefined,
      },
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 딤 배경 */}
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      {/* 바텀시트 */}
      <div className="relative w-full max-w-[390px] bg-white rounded-t-[24px] px-5 pt-5 pb-8 shadow-xl">
        {/* 핸들 */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        <h2 className="text-[16px] font-medium text-ink mb-5">새 옷 추가</h2>

        {/* 이름 */}
        <div className="mb-4">
          <label className="text-[11px] text-ink-hint mb-1.5 block">이름 *</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: 올리브 와이드 팬츠"
            className="w-full border border-border rounded-[12px] px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-hint focus:outline-none focus:border-brand"
          />
        </div>

        {/* 카테고리 */}
        <div className="mb-4">
          <label className="text-[11px] text-ink-hint mb-1.5 block">카테고리</label>
          <div className="grid grid-cols-3 gap-2">
            {(['top', 'bottom', 'outerwear', 'shoes', 'bag', 'dress'] as ClothingItem['category'][]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-2 rounded-[10px] text-[12px] border transition-colors ${
                  category === cat
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink-muted border-border'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* 색상 */}
        <div className="mb-4">
          <label className="text-[11px] text-ink-hint mb-1.5 block">대표 색상</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-10 h-10 rounded-full border border-border cursor-pointer p-0.5"
            />
            <span className="text-[13px] text-ink-muted font-mono">{colorHex}</span>
          </div>
        </div>

        {/* 소재 / 스타일 (선택) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[11px] text-ink-hint mb-1.5 block">소재 (선택)</label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="예: 면, 울, 데님"
              className="w-full border border-border rounded-[12px] px-3 py-2 text-[13px] text-ink placeholder:text-ink-hint focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="text-[11px] text-ink-hint mb-1.5 block">스타일 (선택)</label>
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="예: 캐주얼, 클래식"
              className="w-full border border-border rounded-[12px] px-3 py-2 text-[13px] text-ink placeholder:text-ink-hint focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* 계절 */}
        <div className="mb-6">
          <label className="text-[11px] text-ink-hint mb-1.5 block">계절 (선택)</label>
          <div className="flex gap-2">
            {seasonOptions.map((s) => (
              <button
                key={s}
                onClick={() => handleSeasonToggle(s)}
                className={`flex-1 py-2 rounded-[10px] text-[12px] border transition-colors ${
                  season.includes(s)
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink-muted border-border'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={!label.trim() || saving}
          className="w-full py-3.5 bg-ink text-white rounded-cta text-[14px] font-medium disabled:opacity-40 transition-opacity"
        >
          {saving ? '저장 중…' : '옷장에 추가'}
        </button>
      </div>
    </div>
  );
}

// ── WardrobePage ───────────────────────────────────────────
export function WardrobePage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ClothingItem['category'] | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'mock'>('mock');

  // 초기 로드
  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await fetchClothingItems('demo-user-1');
      setItems(result);
      setDbStatus(isSupabaseAvailable ? 'connected' : 'mock');
      setLoading(false);
    }
    load();
  }, []);

  // 필터 적용
  const filtered =
    activeFilter === 'all'
      ? items
      : items.filter((item) => item.category === activeFilter);

  // 삭제 핸들러
  const handleDelete = async (id: string) => {
    const ok = await deleteClothingItem(id);
    if (ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      // mock 모드: 로컬 상태만 변경
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // 추가 핸들러
  const handleAdd = async (item: Omit<ClothingItem, 'id' | 'wearCount' | 'createdAt'>) => {
    const newItem = await addClothingItem(item);
    if (newItem) {
      setItems((prev) => [newItem, ...prev]);
    } else {
      // mock fallback: 임시 로컬 아이템
      const tempItem: ClothingItem = {
        ...item,
        id: `temp-${Date.now()}`,
        wearCount: 0,
        createdAt: new Date(),
      };
      setItems((prev) => [tempItem, ...prev]);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-cream">
      <TopBar variant="wardrobe" title="내 옷장" />

      {/* 상태 배지 (개발용) */}
      {import.meta.env.DEV && (
        <div className="mx-[18px] mt-1 mb-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-pill ${
              dbStatus === 'connected'
                ? 'bg-olive/10 text-olive'
                : 'bg-oat text-ink-muted'
            }`}
          >
            {dbStatus === 'connected' ? '✓ Supabase 연결됨' : '⚠ Mock 데이터'}
          </span>
        </div>
      )}

      {/* 헤더 섹션 */}
      <div className="px-[18px] pt-2 pb-3">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-serif text-[22px] text-ink leading-tight">내 옷장</h1>
            <p className="text-[12px] text-ink-hint mt-0.5">
              {items.length}벌 등록됨
            </p>
          </div>
          {/* 추가 버튼 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-ink text-white text-[12px] font-medium px-4 py-2 rounded-pill"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            추가
          </button>
        </div>
      </div>

      {/* 카테고리 필터 탭 */}
      <div className="px-[18px] pb-3 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = cat === activeFilter;
            const label = cat === 'all' ? '전체' : CATEGORY_LABELS[cat];
            const count =
              cat === 'all'
                ? items.length
                : items.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-pill text-[12px] border transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink-muted border-border'
                }`}
              >
                {label}
                <span
                  className={`text-[10px] ${
                    isActive ? 'text-white/70' : 'text-ink-hint'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 옷 그리드 */}
      <div className="flex-1 px-[18px] pb-4">
        {loading ? (
          /* 스켈레톤 */
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-card border border-border overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-border" />
                <div className="px-3 py-2.5 space-y-2">
                  <div className="h-3 bg-border rounded w-3/4" />
                  <div className="h-2.5 bg-border rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8A8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
            </svg>
            <p className="text-[13px] text-ink-hint">
              {activeFilter === 'all'
                ? '아직 옷이 없어요'
                : `${CATEGORY_LABELS[activeFilter]} 아이템이 없어요`}
            </p>
            {activeFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="text-[12px] text-brand font-medium"
              >
                첫 번째 옷 추가하기 →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <ClothingCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      <BottomNav />
    </div>
  );
}
