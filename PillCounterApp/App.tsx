import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCameraPermission } from './src/hooks/useCameraPermission';
import { useObjectDetection, Detection } from './src/hooks/useObjectDetection';
import { CameraView } from './src/components/CameraView';
import { ScanAreaOverlay, useScanAreaDimensions } from './src/components/ScanAreaOverlay';
import { PillCountDisplay } from './src/components/PillCountDisplay';
import { PermissionRequest } from './src/components/PermissionRequest';
import { PermissionDenied } from './src/components/PermissionDenied';
import { DetectionOverlay, transformModelToScreen } from './src/components/DetectionOverlay';

export default function App() {
  const { status, requestPermission } = useCameraPermission();
  const { isStable, isModelLoaded, detections, frameProcessor, frameMetadata } = useObjectDetection();
  const scanArea = useScanAreaDimensions();

  // 스캔 영역 내에 있는 탐지만 필터링
  const filteredDetections = useMemo(() => {
    if (!frameMetadata) return [];

    return detections.filter((detection) => {
      // 모델 좌표를 화면 좌표로 변환
      const screenCoords = transformModelToScreen(
        detection.box,
        frameMetadata.width,
        frameMetadata.height,
        scanArea.screenWidth,
        scanArea.screenHeight,
        frameMetadata.orientation
      );

      // 바운딩 박스 중심점 계산
      const centerX = screenCoords.left + screenCoords.width / 2;
      const centerY = screenCoords.top + screenCoords.height / 2;

      // 스캔 영역 경계
      const scanLeft = scanArea.left;
      const scanRight = scanArea.left + scanArea.size;
      const scanTop = scanArea.top;
      const scanBottom = scanArea.top + scanArea.size;

      // 중심점이 스캔 영역 내에 있는지 확인
      return (
        centerX >= scanLeft &&
        centerX <= scanRight &&
        centerY >= scanTop &&
        centerY <= scanBottom
      );
    });
  }, [detections, frameMetadata, scanArea]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        );
      case 'granted':
        return (
          <>
            <CameraView frameProcessor={frameProcessor} />
            <DetectionOverlay detections={detections} frameMetadata={frameMetadata} />
            <ScanAreaOverlay />
            <PillCountDisplay count={filteredDetections.length} isStable={isStable} />
            {!isModelLoaded && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>모델 로딩 중...</Text>
              </View>
            )}
          </>
        );
      case 'denied':
        return <PermissionDenied />;
      case 'not-determined':
      default:
        return <PermissionRequest onRequest={requestPermission} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
  },
});
