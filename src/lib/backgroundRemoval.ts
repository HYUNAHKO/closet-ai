/**
 * @imgly/background-removal — 브라우저 내 WASM 처리
 * 첫 호출 시 ~50MB 모델을 CDN에서 다운로드한다
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _removeFn: ((src: File | Blob | string) => Promise<Blob>) | null = null;

async function getRemoveFn() {
  if (_removeFn) return _removeFn;
  const mod = await import('@imgly/background-removal');
  _removeFn = mod.removeBackground;
  return _removeFn;
}

/**
 * 파일에서 배경을 제거한 뒤 object URL을 반환.
 * 실패 시 null (호출자가 원본 URL을 fallback으로 사용)
 */
export async function stripBackground(file: File): Promise<string | null> {
  try {
    const remove = await getRemoveFn();
    const blob = await remove(file);
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('[backgroundRemoval] failed:', err);
    return null;
  }
}
