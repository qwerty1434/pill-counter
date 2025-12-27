import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCameraPermission } from './src/hooks/useCameraPermission';
import { useObjectDetection } from './src/hooks/useObjectDetection';
import { CameraView } from './src/components/CameraView';
import { ScanAreaOverlay } from './src/components/ScanAreaOverlay';
import { PillCountDisplay } from './src/components/PillCountDisplay';
import { PermissionRequest } from './src/components/PermissionRequest';
import { PermissionDenied } from './src/components/PermissionDenied';
import { DetectionOverlay } from './src/components/DetectionOverlay';

export default function App() {
  const { status, requestPermission } = useCameraPermission();
  const { count, isStable, isModelLoaded, detections, frameProcessor } = useObjectDetection();

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
            <DetectionOverlay detections={detections} />
            <ScanAreaOverlay />
            <PillCountDisplay count={count} isStable={isStable} />
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
