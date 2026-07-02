import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { NavBar } from '@/src/components/common/layout/NavBar/NavBar';
import { colors } from '@/src/theme/tokens';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavBar title="プライバシー" onBack={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
