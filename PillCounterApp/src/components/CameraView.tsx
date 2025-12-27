import React from 'react';
import { StyleSheet } from 'react-native';
import { Camera, useCameraDevice, ReadonlyFrameProcessor } from 'react-native-vision-camera';

interface CameraViewProps {
  frameProcessor?: ReadonlyFrameProcessor;
}

/**
 * 후면 카메라 프리뷰를 표시하는 컴포넌트
 * frameProcessor를 전달받아 실시간 프레임 처리 가능
 */
export function CameraView({ frameProcessor }: CameraViewProps) {
  const device = useCameraDevice('back');

  if (!device) {
    return null;
  }

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
    />
  );
}
