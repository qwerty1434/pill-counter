import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

/**
 * 스캔 영역 크기 및 위치 계산
 * 화면 회전에 대응하기 위해 동적으로 계산
 */
export function useScanAreaDimensions() {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width, height) * 0.8;
  const top = (height - size) / 2 - 50;
  const left = (width - size) / 2;

  return { size, top, left, screenWidth: width, screenHeight: height };
}

/**
 * 카메라 프리뷰 위에 표시되는 스캔 영역 가이드
 * 빨간 점선 사각형으로 알약을 놓을 영역을 안내
 */
export function ScanAreaOverlay() {
  const { size, top, left } = useScanAreaDimensions();

  return (
    <View style={styles.container} pointerEvents="none">
      <View
        style={[
          styles.scanArea,
          { width: size, height: size, top, left },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  scanArea: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FF3B30',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
});
