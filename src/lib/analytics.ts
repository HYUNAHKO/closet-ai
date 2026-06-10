const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwnmczRQRO0sCWrIJ48FLxPs7nNJKKgMZrkpSNj05BcKErn1RhHbDi43fLD9sLNxqKqlQ/exec';

function getUV(): string {
  const key = 'closet_uv';
  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem(key, id);
  }
  return id;
}

function getTimestamp(): string {
  const d = new Date();
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getUtm(): string {
  const fromUrl = new URLSearchParams(window.location.search).get('utm');
  if (fromUrl) {
    sessionStorage.setItem('closet_utm', fromUrl);
    return fromUrl;
  }
  return sessionStorage.getItem('closet_utm') ?? 'direct';
}

// step 값: 'onboard_start' | 'tryon_view' | 'outfit_saved'
export function trackEvent(step: string, frequency = ''): void {
  const data = JSON.stringify({
    id: getUV(),
    timestamp: getTimestamp(),
    utm: getUtm(),
    step,
    frequency,
  });

  // fire-and-forget, 실패해도 앱 동작에 영향 없음
  fetch(`${APPS_SCRIPT_URL}?action=insert&table=events&data=${encodeURIComponent(data)}`, {
    mode: 'no-cors',
  }).catch(() => {});
}
