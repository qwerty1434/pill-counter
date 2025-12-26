import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCameraPermission } from './src/hooks/useCameraPermission';
import { useMockPillCount } from './src/hooks/useMockPillCount';
import { CameraView } from './src/components/CameraView';
import { ScanAreaOverlay } from './src/components/ScanAreaOverlay';
import { PillCountDisplay } from './src/components/PillCountDisplay';
import { PermissionRequest } from './src/components/PermissionRequest';
import { PermissionDenied } from './src/components/PermissionDenied';

export default function App() {
  const { status, requestPermission } = useCameraPermission();
  const { count, isStable } = useMockPillCount();

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
            <CameraView />
            <ScanAreaOverlay />
            <PillCountDisplay count={count} isStable={isStable} />
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
});
