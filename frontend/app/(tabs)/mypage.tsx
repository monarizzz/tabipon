import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Shield, Info, Settings } from "lucide-react-native";
import { NavBar } from "@/src/components/common/layout/NavBar/NavBar";
import { ProfileSection } from "@/src/components/features/mypage/ProfileSection/ProfileSection";
import { RecentCollectionsSection } from "@/src/components/features/mypage/RecentCollectionsSection/RecentCollectionsSection";
import { SettingsMenuSection } from "@/src/components/features/mypage/SettingsMenuSection/SettingsMenuSection";
import { colors, spacing } from "@/src/theme/tokens";

const RECENT_COLLECTIONS = [
  { id: "asakusa", name: "浅草寺" },
  { id: "skytree", name: "スカイツリー" },
  { id: "palace", name: "皇居" },
];

export default function MypageScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavBar
        title="マイページ"
        rightIcon={<Settings size={16} color={colors.textMuted} />}
        onRightPress={() => {}}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ProfileSection name="たびすたんぷ太郎" registeredDate="2025.02.16" />
        <RecentCollectionsSection
          items={RECENT_COLLECTIONS}
          onPressSeeAll={() => router.push("/(tabs)/album")}
        />
        <View style={styles.recentToSettingsSpacer} />
        <SettingsMenuSection
          items={[
            {
              id: "notifications",
              label: "通知設定",
              icon: Bell,
              onPress: () => router.push("/mypage/notifications"),
            },
            {
              id: "privacy",
              label: "プライバシー",
              icon: Shield,
              onPress: () => router.push("/mypage/privacy"),
            },
            {
              id: "help",
              label: "ヘルプ",
              icon: Info,
              onPress: () => router.push("/mypage/help"),
            },
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
    gap: 35,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  recentToSettingsSpacer: {
    height: spacing.xl,
  },
});
