import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PillCountDisplayProps {
  count: number;
  isStable: boolean;
}

/**
 * 알약 개수를 화면에 표시하는 컴포넌트
 */
export function PillCountDisplay({ count, isStable }: PillCountDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.badge, isStable && styles.badgeStable]}>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.label}>알약 개수</Text>
      </View>
      {!isStable && (
        <Text style={styles.scanning}>스캔 중...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  badgeStable: {
    borderColor: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  count: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  label: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  scanning: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 8,
  },
});
