/**
 * MediaPipe Tasks Vision — PoseLandmarker를 CDN 모델로 초기화
 * 셀카 이미지에서 어깨/허리/다리 비율을 추출한다
 */

import type { BodyMeasurements } from '../types';

// Landmark indices (MediaPipe Pose 33-point model)
const LM = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

type NormalizedLandmark = { x: number; y: number; z: number; visibility?: number };
type PoseResult = { landmarks: NormalizedLandmark[][] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _landmarker: any = null;

export async function initPoseLandmarker(): Promise<boolean> {
  if (_landmarker) return true;
  try {
    const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
    );
    _landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numPoses: 1,
    });
    return true;
  } catch (err) {
    console.error('[bodyAnalysis] MediaPipe init failed:', err);
    return false;
  }
}

export async function analyzePose(
  imageEl: HTMLImageElement
): Promise<BodyMeasurements | null> {
  const ready = await initPoseLandmarker();
  if (!ready || !_landmarker) return null;

  try {
    const result: PoseResult = _landmarker.detect(imageEl);
    const lms = result.landmarks?.[0];
    if (!lms || lms.length < 29) return null;

    const lShoulder = lms[LM.LEFT_SHOULDER];
    const rShoulder = lms[LM.RIGHT_SHOULDER];
    const lHip = lms[LM.LEFT_HIP];
    const rHip = lms[LM.RIGHT_HIP];
    const lAnkle = lms[LM.LEFT_ANKLE];
    const rAnkle = lms[LM.RIGHT_ANKLE];
    const nose = lms[LM.NOSE];

    const shoulderW = Math.abs(lShoulder.x - rShoulder.x);
    const hipW = Math.abs(lHip.x - rHip.x);
    const shoulderHipRatio = shoulderW / (hipW + 0.001);

    let shoulderWidth: 'narrow' | 'medium' | 'wide';
    if (shoulderHipRatio < 0.92) shoulderWidth = 'narrow';
    else if (shoulderHipRatio > 1.08) shoulderWidth = 'wide';
    else shoulderWidth = 'medium';

    const avgHipY = (lHip.y + rHip.y) / 2;
    const avgAnkleY = (lAnkle.y + rAnkle.y) / 2;
    const bodyHeight = avgAnkleY - nose.y;
    const legLength = avgAnkleY - avgHipY;
    const legRatio =
      bodyHeight > 0.1
        ? Math.min(0.70, Math.max(0.40, legLength / bodyHeight))
        : 0.55;

    const rawWaist = 0.70 + (shoulderHipRatio - 1) * 0.05;
    const waistRatio = Math.min(0.85, Math.max(0.60, rawWaist));

    return {
      shoulderWidth,
      waistRatio: Math.round(waistRatio * 100) / 100,
      legRatio: Math.round(legRatio * 100) / 100,
    };
  } catch (err) {
    console.error('[analyzePose] detection failed:', err);
    return null;
  }
}

// 이미지 URL → HTMLImageElement 변환 (CORS 주의)
export function urlToImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
