import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CommonButton } from '@/src/components/common';
import { colors, typography, spacing } from '@/src/theme/tokens';

export default function CameraScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>カメラ画面</Text>
      <CommonButton label="写真調整画面へ" onPress={() => router.push('/photo-adjust')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  title: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
    color: colors.textPrimary,
  },
});
