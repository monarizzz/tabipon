import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { NavBar } from '@/src/components/common/layout/NavBar/NavBar';
import { colors } from '@/src/theme/tokens';

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavBar title="通知設定" onBack={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
