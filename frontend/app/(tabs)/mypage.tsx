import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { NavBar } from '@/src/components/common';
import { ProfileSection } from '@/src/components/features/mypage/ProfileSection';
import { RecentCollectionsSection } from '@/src/components/features/mypage/RecentCollectionsSection';
import { SettingsMenuSection } from '@/src/components/features/mypage/SettingsMenuSection';
import { colors, spacing } from '@/src/theme/tokens';

const RECENT_COLLECTIONS = [
  { id: 'asakusa', name: '浅草寺' },
  { id: 'skytree', name: 'スカイツリー' },
  { id: 'palace', name: '皇居' },
];

export default function MypageScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavBar title="マイページ" />
      <ScrollView contentContainerStyle={styles.content}>
        <ProfileSection name="たびすたんぷ太郎" registeredDate="2025.02.16" />
        <RecentCollectionsSection items={RECENT_COLLECTIONS} onPressSeeAll={() => {}} />
        <SettingsMenuSection
          items={[
            { id: 'notifications', label: '通知設定', onPress: () => router.push('/mypage/notifications') },
            { id: 'privacy', label: 'プライバシー', onPress: () => router.push('/mypage/privacy') },
            { id: 'help', label: 'ヘルプ', onPress: () => router.push('/mypage/help') },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    gap: spacing.xxl,
    padding: spacing.xl,
  },
});
