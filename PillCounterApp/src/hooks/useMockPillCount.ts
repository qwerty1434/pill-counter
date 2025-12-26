import { useEffect, useState, useRef } from 'react';

const MOCK_UPDATE_INTERVAL = 1000;
const STABILIZATION_WINDOW = 5;
const MIN_COUNT = 0;
const MAX_COUNT = 15;

/**
 * Mock 알약 개수를 생성하고 안정화하는 훅
 * 추후 실제 AI 모델로 교체 예정
 */
export function useMockPillCount() {
  const [count, setCount] = useState<number>(0);
  const [isStable, setIsStable] = useState<boolean>(false);
  const recentCounts = useRef<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const mockCount = generateMockCount();
      const stabilizedCount = stabilizeCount(mockCount, recentCounts.current);

      setCount(stabilizedCount);
      setIsStable(checkStability(recentCounts.current));
    }, MOCK_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { count, isStable };
}

/**
 * 랜덤 Mock 개수 생성
 */
function generateMockCount(): number {
  return Math.floor(Math.random() * (MAX_COUNT - MIN_COUNT + 1)) + MIN_COUNT;
}

/**
 * 최근 N개 값의 최빈값으로 안정화
 */
function stabilizeCount(newCount: number, history: number[]): number {
  history.push(newCount);

  if (history.length > STABILIZATION_WINDOW) {
    history.shift();
  }

  return getMode(history);
}

/**
 * 최빈값 계산
 */
function getMode(numbers: number[]): number {
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = numbers[0];

  for (const num of numbers) {
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num];
      mode = num;
    }
  }

  return mode;
}

/**
 * 안정성 체크 (최근 값들이 동일한지)
 */
function checkStability(history: number[]): boolean {
  if (history.length < STABILIZATION_WINDOW) {
    return false;
  }

  const lastValue = history[history.length - 1];
  const stableCount = history.filter(v => v === lastValue).length;

  return stableCount >= Math.floor(STABILIZATION_WINDOW * 0.6);
}
