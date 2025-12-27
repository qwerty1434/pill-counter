import { useEffect, useState, useRef, useCallback } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import {
  useFrameProcessor,
  runAtTargetFps,
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

const CONFIDENCE_THRESHOLD = 0.3;
const STABILIZATION_WINDOW = 5;
const MODEL_INPUT_SIZE = 320; // EfficientDet-Lite0 입력 크기

// 탐지된 객체 정보 타입
export interface Detection {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

/**
 * EfficientDet-Lite0을 사용한 객체 탐지 훅
 * 카메라 프레임에서 객체를 탐지하고 개수를 반환
 */
export function useObjectDetection() {
  const [count, setCount] = useState<number>(0);
  const [isStable, setIsStable] = useState<boolean>(false);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const recentCounts = useRef<number[]>([]);

  // TFLite 모델 로드
  const objectDetection = useTensorflowModel(
    require('../../assets/models/efficientdet_lite0.tflite')
  );

  const model =
    objectDetection.state === 'loaded' ? objectDetection.model : undefined;

  // 모델 로드 상태 업데이트
  useEffect(() => {
    if (objectDetection.state === 'loaded') {
      setIsModelLoaded(true);
    }
  }, [objectDetection.state]);

  const { resize } = useResizePlugin();

  // JS에서 탐지 결과 업데이트하는 함수 (worklet에서 호출됨)
  const onDetection = useCallback((detectedCount: number, newDetections: Detection[]) => {
    setDetections(newDetections);
    recentCounts.current.push(detectedCount);

    if (recentCounts.current.length > STABILIZATION_WINDOW) {
      recentCounts.current.shift();
    }

    // 최빈값 계산
    const stabilizedCount = getMode(recentCounts.current);
    setCount(stabilizedCount);

    // 안정성 체크
    const isNowStable = checkStability(recentCounts.current);
    setIsStable(isNowStable);
  }, []);

  // worklet에서 JS 함수 호출을 위한 래퍼
  const onDetectionWorklet = Worklets.createRunOnJS(onDetection);

  // Frame Processor
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (model == null) return;

      // 초당 2회만 추론 실행 (성능 최적화)
      runAtTargetFps(2, () => {
        'worklet';
        try {
          // 1. 프레임을 모델 입력 크기로 리사이즈
          const resized = resize(frame, {
            scale: {
              width: MODEL_INPUT_SIZE,
              height: MODEL_INPUT_SIZE,
            },
            pixelFormat: 'rgb',
            dataType: 'uint8',
          });

          // 2. 모델 추론 실행
          const outputs = model.runSync([resized]);

          // 3. 출력 해석
          // EfficientDet-Lite0 출력: [detection_boxes, detection_classes, detection_scores, num_detections]
          const detection_boxes = outputs[0];
          const detection_scores = outputs[2];
          const num_detections = outputs[3];

          // 4. 신뢰도 기준 이상인 탐지만 추출
          const newDetections: Detection[] = [];
          const totalDetections = Math.min(Number(num_detections[0]), 25); // EfficientDet-Lite는 최대 25개

          for (let i = 0; i < totalDetections; i++) {
            const score = Number(detection_scores[i]);
            if (score > CONFIDENCE_THRESHOLD) {
              // EfficientDet-Lite 박스 형식: [ymin, xmin, ymax, xmax] (0~1 정규화)
              const ymin = Number(detection_boxes[i * 4 + 0]);
              const xmin = Number(detection_boxes[i * 4 + 1]);
              const ymax = Number(detection_boxes[i * 4 + 2]);
              const xmax = Number(detection_boxes[i * 4 + 3]);

              newDetections.push({
                box: {
                  x: xmin,
                  y: ymin,
                  width: xmax - xmin,
                  height: ymax - ymin,
                },
                confidence: score,
              });
            }
          }

          // 5. JS로 결과 전달
          onDetectionWorklet(newDetections.length, newDetections);
        } catch (e) {
          // worklet 에러 무시
        }
      });
    },
    [model, resize, onDetectionWorklet]
  );

  return {
    count,
    isStable,
    isModelLoaded,
    detections,
    frameProcessor,
  };
}

/**
 * 최빈값 계산
 */
function getMode(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = numbers[0];

  for (const num of numbers) {
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num];
      mode = num;
    }
  }

  return mode;
}

/**
 * 안정성 체크 (최근 값들의 60% 이상이 동일한지)
 */
function checkStability(history: number[]): boolean {
  if (history.length < STABILIZATION_WINDOW) {
    return false;
  }

  const lastValue = history[history.length - 1];
  const stableCount = history.filter((v) => v === lastValue).length;

  return stableCount >= Math.floor(STABILIZATION_WINDOW * 0.6);
}
