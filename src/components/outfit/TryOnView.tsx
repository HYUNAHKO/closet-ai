import { TryOnSilhouette } from '../home/TryOnSilhouette';

interface TryOnViewProps {
  /** Week 3에서 IDM-VTON 결과 이미지가 들어올 자리. 없으면 실루엣 placeholder 표시 */
  tryOnImageUrl?: string;
}

export function TryOnView({ tryOnImageUrl }: TryOnViewProps) {
  if (tryOnImageUrl) {
    return (
      <div className="flex justify-center pt-2">
        <img
          src={tryOnImageUrl}
          alt="가상 시착 결과"
          className="w-[260px] h-[360px] object-cover rounded-[16px] shadow-md"
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
