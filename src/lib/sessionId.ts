const SID_KEY = 'closet_sid';

/** 디바이스당 고정 UUID. 없으면 생성해서 저장. */
export function getSessionId(): string {
  const id = localStorage.getItem(SID_KEY);
  if (id) return id;
  const newId = crypto.randomUUID();
  localStorage.setItem(SID_KEY, newId);
  return newId;
}

/** 새 사용자가 온보딩을 시작할 때 호출 — 이전 세션 완전 초기화. */
export function resetSession(): void {
  const newId = crypto.randomUUID();
  localStorage.setItem(SID_KEY, newId);
  localStorage.removeItem('closet_person_url');
  // 이전 try-on 캐시(closet_tryon_*) 는 다른 세션ID를 가지므로 자동으로 무시됨
}

/** 아이템별 try-on 캐시 키 — (sessionId, outfitId, itemId) 조합으로 고유. */
export function tryOnCacheKey(outfitId: string, itemId: string): string {
  return `closet_tryon_${getSessionId()}_${outfitId}_${itemId}`;
}

/** SavedPage 표시용 — 가장 최근 성공한 try-on URL (아이템 무관). */
export function tryOnDisplayKey(outfitId: string): string {
  return `closet_tryon_display_${getSessionId()}_${outfitId}`;
}
