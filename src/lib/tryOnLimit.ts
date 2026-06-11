const SESSION_KEY = 'closet_tryon_count';
export const TRYON_LIMIT = 3;

export function getTryOnCount(): number {
  return Number(sessionStorage.getItem(SESSION_KEY) ?? 0);
}

export function canTryOn(): boolean {
  return getTryOnCount() < TRYON_LIMIT;
}

export function incrementTryOnCount(): void {
  sessionStorage.setItem(SESSION_KEY, String(getTryOnCount() + 1));
}
