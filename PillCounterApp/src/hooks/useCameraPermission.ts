import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export type PermissionStatus = 'loading' | 'granted' | 'denied' | 'not-determined';

/**
 * 카메라 권한 상태를 관리하는 훅
 * 앱이 포그라운드로 돌아올 때 권한 상태를 다시 확인함
 */
export function useCameraPermission() {
  const [status, setStatus] = useState<PermissionStatus>('loading');

  const checkPermission = useCallback(async () => {
    const cameraPermission = await Camera.getCameraPermissionStatus();
    setStatus(mapPermissionStatus(cameraPermission));
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // 앱이 포그라운드로 돌아올 때 권한 재확인
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkPermission();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkPermission]);

  const requestPermission = async () => {
    const newPermission = await Camera.requestCameraPermission();
    setStatus(mapPermissionStatus(newPermission));
  };

  return { status, requestPermission };
}

function mapPermissionStatus(permission: string): PermissionStatus {
  switch (permission) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    case 'not-determined':
      return 'not-determined';
    default:
      return 'denied';
  }
}
