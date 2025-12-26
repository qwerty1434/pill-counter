# PillCounterApp

휴대폰 카메라를 이용해 실시간으로 알약 개수를 세는 모바일 앱

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Expo (React Native) |
| 언어 | TypeScript |
| 카메라 | react-native-vision-camera |
| UI | React Native 기본 컴포넌트 |
| AI 모델 | 추후 react-native-fast-tflite 연동 (현재는 Mock) |

## 개발 환경

- Mac M1 (Xcode, Android Studio 설치됨)
- iOS/Android 동시 개발
- **Expo Development Build 필수** (Expo Go 사용 불가)

## 핵심 기능

1. 카메라 프리뷰 화면 표시
2. ROI(Region of Interest) 가이드 영역 (빨간 점선 사각형)
3. 알약 개수 표시 (현재는 Mock 데이터)

---

## 구현 단계

### Phase 1: 프로젝트 초기화

```bash
# 1. Expo 프로젝트 생성
npx create-expo-app PillCounterApp --template blank-typescript
cd PillCounterApp

# 2. 필수 라이브러리 설치
npx expo install react-native-vision-camera
npx expo install react-native-worklets-core
npx expo install react-native-reanimated
npx expo install expo-dev-client
```

### Phase 2: 카메라 화면 구현

- 카메라 권한 요청 로직
- 카메라 프리뷰 컴포넌트
- ROI 오버레이 (빨간 점선 사각형)
- 알약 개수 표시 UI

### Phase 3: Mock 분석 로직

- 주기적으로 랜덤 숫자 생성 (실제 AI 모델 대체)
- 개수 안정화 로직 (최근 N개 프레임의 최빈값)
- UI에 실시간 반영

### Phase 4: 개발 빌드 및 테스트

```bash
# iOS 빌드
npx expo run:ios

# Android 빌드
npx expo run:android
```

---

## 파일 구조

```
PillCounterApp/
├── App.tsx                    # 메인 앱 컴포넌트
├── app.json                   # Expo 설정
├── src/
│   ├── components/
│   │   ├── CameraView.tsx     # 카메라 프리뷰
│   │   ├── ROIOverlay.tsx     # 가이드 영역 오버레이
│   │   └── CountDisplay.tsx   # 개수 표시
│   ├── hooks/
│   │   └── useMockPillCount.ts  # Mock 개수 생성 훅
│   └── utils/
│       └── countStabilizer.ts   # 개수 안정화 유틸
├── assets/
│   └── (추후 AI 모델 파일)
└── package.json
```

---

## 주요 고려사항

### Expo Development Build 필요
- react-native-vision-camera는 네이티브 모듈
- Expo Go에서 실행 불가
- `expo-dev-client` 설치 후 `npx expo run:ios` / `npx expo run:android` 사용

### 카메라 권한
- iOS: Info.plist에 카메라 사용 목적 설명 필요
- Android: AndroidManifest.xml에 CAMERA 권한 필요
- app.json의 plugins 설정으로 자동 처리됨

### app.json 설정 예시

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "알약 개수를 세기 위해 카메라 접근이 필요합니다."
        }
      ],
      [
        "react-native-reanimated",
        {
          "processNestedWorklets": true
        }
      ]
    ]
  }
}
```

---

## 추후 AI 모델 연동 시

1. react-native-fast-tflite 설치
2. 알약 인식 모델 다운로드 (.tflite)
3. frameProcessor에서 실제 모델 추론으로 교체
