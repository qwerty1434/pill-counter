import React from 'react';
import { StyleSheet } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

/**
 * 후면 카메라 프리뷰를 표시하는 컴포넌트
 */
export function CameraView() {
  const device = useCameraDevice('back');

  if (!device) {
    return null;
  }

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
    />
  );
}
