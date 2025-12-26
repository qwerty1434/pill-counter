import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PermissionRequestProps {
  onRequest: () => void;
}

/**
 * 카메라 권한 요청 UI 컴포넌트
 */
export function PermissionRequest({ onRequest }: PermissionRequestProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>카메라 권한 필요</Text>
      <Text style={styles.description}>
        알약 개수를 세기 위해 카메라 접근 권한이 필요합니다.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRequest}>
        <Text style={styles.buttonText}>권한 허용</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
