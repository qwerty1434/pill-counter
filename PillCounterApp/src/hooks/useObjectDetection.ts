import { useEffect, useState, useRef, useCallback } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useFrameProcessor, runAtTargetFps } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

const CONFIDENCE_THRESHOLD = 0.5;
const STABILIZATION_WINDOW = 5;
const MODEL_INPUT_SIZE = 832;
const NUM_CANDIDATES = 14196;
const IOU_THRESHOLD = 0.5; // NMS IoU 임계값

export interface Detection {
  box: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface FrameMetadata {
  width: number;
  height: number;
  orientation: string;
}

/**
 * YOLOv10n 객체 탐지 훅
 */
export function useObjectDetection() {
  const [count, setCount] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [frameMetadata, setFrameMetadata] = useState<FrameMetadata | null>(null);
  const recentCounts = useRef<number[]>([]);

  // 모델 로드 (YOLO11s 알약 탐지 모델)
  const { state, model: loadedModel } = useTensorflowModel(
    require('../../assets/models/model.tflite')
  );
  const model = state === 'loaded' ? loadedModel : undefined;

  useEffect(() => {
    if (state === 'loaded') setIsModelLoaded(true);
  }, [state]);

  const { resize } = useResizePlugin();

  // 탐지 결과 처리
  const handleDetection = useCallback((newDetections: Detection[], frameMeta: FrameMetadata) => {
    setDetections(newDetections);
    setFrameMetadata(frameMeta);

    recentCounts.current.push(newDetections.length);
    if (recentCounts.current.length > STABILIZATION_WINDOW) {
      recentCounts.current.shift();
    }

    setCount(getMode(recentCounts.current));
    setIsStable(checkStability(recentCounts.current));
  }, []);

  const handleDetectionWorklet = Worklets.createRunOnJS(handleDetection);

  // 디버그 로그
  const log = useCallback((msg: string) => console.log('[YOLO Debug]', msg), []);
  const logWorklet = Worklets.createRunOnJS(log);

  // Frame Processor
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (!model) return;

      runAtTargetFps(2, () => {
        'worklet';

        // 프레임 메타데이터 캡처
        const frameMeta: FrameMetadata = {
          width: frame.width,
          height: frame.height,
          orientation: frame.orientation,
        };

        logWorklet(`Frame: ${frameMeta.width}x${frameMeta.height}, orientation: ${frameMeta.orientation}`);

        try {
          // 프레임 리사이즈
          const resized = resize(frame, {
            scale: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE },
            pixelFormat: 'rgb',
            dataType: 'float32',
          });

          // 추론 실행
          const output = model.runSync([resized])[0];

          // YOLO11 출력 형식: [1, 5, 14196] (flatten → 70980)
          // 데이터 배치: [x0,x1,...x14195, y0,y1,..., w0,w1,..., h0,h1,..., score0,score1,...]
          const results: Detection[] = [];

          for (let i = 0; i < NUM_CANDIDATES; i++) {
            // score는 4번째 속성 (index 4 * NUM_CANDIDATES + i)
            const score = Number(output[4 * NUM_CANDIDATES + i]);

            if (score > CONFIDENCE_THRESHOLD) {
              // x, y는 중심 좌표, w, h는 너비/높이 (이미 0~1 정규화됨)
              const cx = Number(output[0 * NUM_CANDIDATES + i]);
              const cy = Number(output[1 * NUM_CANDIDATES + i]);
              const w = Number(output[2 * NUM_CANDIDATES + i]);
              const h = Number(output[3 * NUM_CANDIDATES + i]);

              // 중심 좌표를 좌상단 좌표로 변환
              results.push({
                box: {
                  x: cx - w / 2,
                  y: cy - h / 2,
                  width: w,
                  height: h,
                },
                confidence: score,
              });
            }
          }

          // NMS 적용하여 중복 박스 제거
          const nmsResults = applyNMS(results, IOU_THRESHOLD);

          logWorklet(`Detected: ${nmsResults.length} (before NMS: ${results.length})`);

          // 디버그: 첫 번째 박스 좌표 확인
          if (nmsResults.length > 0) {
            const b = nmsResults[0].box;
            logWorklet(`Box[0]: x=${b.x.toFixed(3)}, y=${b.y.toFixed(3)}, w=${b.width.toFixed(3)}, h=${b.height.toFixed(3)}`);
          }

          handleDetectionWorklet(nmsResults, frameMeta);
        } catch (e: any) {
          logWorklet(`Error: ${e?.message || String(e)}`);
        }
      });
    },
    [model, resize, handleDetectionWorklet, logWorklet]
  );

  return { count, isStable, isModelLoaded, detections, frameProcessor, frameMetadata };
}

// 최빈값 계산
function getMode(numbers: number[]): number {
  if (!numbers.length) return 0;
  const freq: Record<number, number> = {};
  let maxFreq = 0, mode = numbers[0];
  for (const n of numbers) {
    freq[n] = (freq[n] || 0) + 1;
    if (freq[n] > maxFreq) { maxFreq = freq[n]; mode = n; }
  }
  return mode;
}

// 안정성 체크
function checkStability(history: number[]): boolean {
  if (history.length < STABILIZATION_WINDOW) return false;
  const last = history[history.length - 1];
  const count = history.filter((v) => v === last).length;
  return count >= Math.floor(STABILIZATION_WINDOW * 0.6);
}

// IoU (Intersection over Union) 계산
function calculateIoU(a: Detection['box'], b: Detection['box']): number {
  'worklet';
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const union = areaA + areaB - intersection;

  return union > 0 ? intersection / union : 0;
}

// NMS (Non-Maximum Suppression) - 중복 박스 제거
function applyNMS(detections: Detection[], iouThreshold: number): Detection[] {
  'worklet';
  if (detections.length === 0) return [];

  // confidence 내림차순 정렬
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: Detection[] = [];

  while (sorted.length > 0) {
    const best = sorted.shift()!;
    kept.push(best);

    // 남은 박스들 중 IoU가 높은 것들 제거
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (calculateIoU(best.box, sorted[i].box) > iouThreshold) {
        sorted.splice(i, 1);
      }
    }
  }

  return kept;
}
