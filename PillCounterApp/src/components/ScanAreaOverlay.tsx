import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.8;
const SCAN_AREA_TOP = (SCREEN_HEIGHT - SCAN_AREA_SIZE) / 2 - 50;

/**
 * 카메라 프리뷰 위에 표시되는 스캔 영역 가이드
 * 빨간 점선 사각형으로 알약을 놓을 영역을 안내
 */
export function ScanAreaOverlay() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.scanArea} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    borderWidth: 3,
    borderColor: '#FF3B30',
    borderStyle: 'dashed',
    borderRadius: 12,
    position: 'absolute',
    top: SCAN_AREA_TOP,
  },
});
