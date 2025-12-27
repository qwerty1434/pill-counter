import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Detection } from '../hooks/useObjectDetection';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DetectionOverlayProps {
  detections: Detection[];
}

/**
 * 탐지된 객체에 바운딩 박스와 인식률을 표시하는 오버레이
 */
export function DetectionOverlay({ detections }: DetectionOverlayProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      {detections.map((detection, index) => {
        const { box, confidence } = detection;

        // 정규화된 좌표(0~1)를 화면 좌표로 변환
        const left = box.x * SCREEN_WIDTH;
        const top = box.y * SCREEN_HEIGHT;
        const width = box.width * SCREEN_WIDTH;
        const height = box.height * SCREEN_HEIGHT;

        const confidencePercent = Math.round(confidence * 100);

        return (
          <View
            key={index}
            style={[
              styles.boundingBox,
              {
                left,
                top,
                width,
                height,
              },
            ]}
          >
            <View style={styles.labelContainer}>
              <Text style={styles.labelText}>{confidencePercent}%</Text>
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
    backgroundColor: 'transparent',
  },
  labelContainer: {
    position: 'absolute',
    top: -24,
    left: -2,
    backgroundColor: '#00FF00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
