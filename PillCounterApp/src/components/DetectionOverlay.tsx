import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Detection, FrameMetadata } from '../hooks/useObjectDetection';

interface DetectionOverlayProps {
  detections: Detection[];
  frameMetadata: FrameMetadata | null;
}

/**
 * 모델 좌표(0~1)를 화면 좌표(픽셀)로 변환
 *
 * 변환 과정:
 * 1. orientation에 따른 좌표 회전 (센서→화면 방향)
 * 2. 모델의 center-crop 역변환: 모델 좌표 → 프레임 픽셀 좌표
 * 3. 화면 cover 변환: 프레임 픽셀 좌표 → 화면 픽셀 좌표
 */
export function transformModelToScreen(
  modelBox: { x: number; y: number; width: number; height: number },
  sensorW: number,
  sensorH: number,
  screenW: number,
  screenH: number,
  orientation: string
): { left: number; top: number; width: number; height: number } {

  // Step 0: orientation에 따라 모델 좌표 회전
  // 모델은 센서 좌표계(landscape)로 추론, 화면은 portrait일 수 있음
  let rotatedBox = { ...modelBox };

  if (orientation === 'landscape-right') {
    // 90도 시계방향 회전 (x,y) → (1-y, x)
    rotatedBox = {
      x: 1 - modelBox.y - modelBox.height,
      y: modelBox.x,
      width: modelBox.height,
      height: modelBox.width,
    };
  } else if (orientation === 'landscape-left') {
    // 90도 반시계방향 회전 (x,y) → (y, 1-x)
    rotatedBox = {
      x: modelBox.y,
      y: 1 - modelBox.x - modelBox.width,
      width: modelBox.height,
      height: modelBox.width,
    };
  }
  // portrait, portrait-upside-down은 회전 불필요 (또는 180도 처리 필요)

  // 회전 후 유효 프레임 크기 (화면 방향 기준)
  const isScreenPortrait = screenH > screenW;
  const isSensorLandscape = orientation === 'landscape-left' || orientation === 'landscape-right';
  const needsSwap = isSensorLandscape && isScreenPortrait;
  const frameW = needsSwap ? sensorH : sensorW;
  const frameH = needsSwap ? sensorW : sensorH;

  // Step 1: 모델의 center-crop 역변환
  // ResizePlugin은 프레임을 1:1로 center-crop한 후 832x832로 스케일
  const cropSize = Math.min(frameW, frameH);
  const cropOffsetX = (frameW - cropSize) / 2;
  const cropOffsetY = (frameH - cropSize) / 2;

  // 모델 좌표(0~1) → 프레임 픽셀 좌표
  const frameX = rotatedBox.x * cropSize + cropOffsetX;
  const frameY = rotatedBox.y * cropSize + cropOffsetY;
  const boxW = rotatedBox.width * cropSize;
  const boxH = rotatedBox.height * cropSize;

  // Step 2: 화면 cover 변환
  // Camera 컴포넌트는 프레임을 화면에 cover 방식으로 표시
  const frameAspect = frameW / frameH;
  const screenAspect = screenW / screenH;

  let scale: number;
  let offsetX: number;
  let offsetY: number;

  if (frameAspect > screenAspect) {
    // 프레임이 화면보다 넓음 → 좌우가 잘림
    scale = screenH / frameH;
    offsetX = (frameW * scale - screenW) / 2;
    offsetY = 0;
  } else {
    // 프레임이 화면보다 높음 → 상하가 잘림
    scale = screenW / frameW;
    offsetX = 0;
    offsetY = (frameH * scale - screenH) / 2;
  }

  return {
    left: frameX * scale - offsetX,
    top: frameY * scale - offsetY,
    width: boxW * scale,
    height: boxH * scale,
  };
}

/**
 * 탐지된 객체에 바운딩 박스를 표시하는 오버레이
 */
export function DetectionOverlay({ detections, frameMetadata }: DetectionOverlayProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  // 프레임 메타데이터가 없으면 렌더링하지 않음
  if (!frameMetadata) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {detections.map((detection, index) => {
        const { box, confidence } = detection;

        const screenCoords = transformModelToScreen(
          box,
          frameMetadata.width,
          frameMetadata.height,
          screenW,
          screenH,
          frameMetadata.orientation
        );

        return (
          <View
            key={index}
            style={[styles.boundingBox, screenCoords]}
          >
            <View style={styles.label}>
              <Text style={styles.labelText}>
                {Math.round(confidence * 100)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00FF00',
  },
  label: {
    position: 'absolute',
    top: -20,
    left: -2,
    backgroundColor: '#00FF00',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  labelText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
