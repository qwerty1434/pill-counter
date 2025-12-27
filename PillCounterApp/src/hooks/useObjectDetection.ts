import { useEffect, useState, useRef, useCallback } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useFrameProcessor, runAtTargetFps } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

const CONFIDENCE_THRESHOLD = 0.3;
const STABILIZATION_WINDOW = 5;
const MODEL_INPUT_SIZE = 640;
const MAX_DETECTIONS = 300;

export interface Detection {
  box: { x: number; y: number; width: number; height: number };
  confidence: number;
}

/**
 * YOLOv10n 객체 탐지 훅
 */
export function useObjectDetection() {
  const [count, setCount] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const recentCounts = useRef<number[]>([]);

  // 모델 로드
  const { state, model: loadedModel } = useTensorflowModel(
    require('../../assets/models/yolov10n.tflite')
  );
  const model = state === 'loaded' ? loadedModel : undefined;

  useEffect(() => {
    if (state === 'loaded') setIsModelLoaded(true);
  }, [state]);

  const { resize } = useResizePlugin();

  // 탐지 결과 처리
  const handleDetection = useCallback((newDetections: Detection[]) => {
    setDetections(newDetections);

    recentCounts.current.push(newDetections.length);
    if (recentCounts.current.length > STABILIZATION_WINDOW) {
      recentCounts.current.shift();
    }

    setCount(getMode(recentCounts.current));
    setIsStable(checkStability(recentCounts.current));
  }, []);

  const handleDetectionWorklet = Worklets.createRunOnJS(handleDetection);

  // Frame Processor
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (!model) return;

      runAtTargetFps(2, () => {
        'worklet';
        try {
          // 프레임 리사이즈
          const resized = resize(frame, {
            scale: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE },
            pixelFormat: 'rgb',
            dataType: 'float32',
          });

          // 추론 실행
          const output = model.runSync([resized])[0];

          // YOLOv10n 출력 파싱: [xmin, ymin, xmax, ymax, score, class] * 300
          const results: Detection[] = [];
          for (let i = 0; i < MAX_DETECTIONS; i++) {
            const idx = i * 6;
            const score = Number(output[idx + 4]);

            if (score > CONFIDENCE_THRESHOLD) {
              const xmin = Number(output[idx]);
              const ymin = Number(output[idx + 1]);
              const xmax = Number(output[idx + 2]);
              const ymax = Number(output[idx + 3]);

              results.push({
                box: { x: xmin, y: ymin, width: xmax - xmin, height: ymax - ymin },
                confidence: score,
              });
            }
          }

          handleDetectionWorklet(results);
        } catch {}
      });
    },
    [model, resize, handleDetectionWorklet]
  );

  return { count, isStable, isModelLoaded, detections, frameProcessor };
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
