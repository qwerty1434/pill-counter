import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

/**
 * 카메라 권한이 거부되었을 때 표시하는 컴포넌트
 */
export function PermissionDenied() {
  const openSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>카메라 권한 거부됨</Text>
      <Text style={styles.description}>
        앱 설정에서 카메라 권한을 허용해주세요.
      </Text>
      <TouchableOpacity style={styles.button} onPress={openSettings}>
        <Text style={styles.buttonText}>설정으로 이동</Text>
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
    backgroundColor: '#FF3B30',
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
