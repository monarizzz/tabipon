import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { NavBar } from "@/src/components/common/layout/NavBar/NavBar";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors } from "@/src/theme/tokens";

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <NavBar title={t("mypage.notifications")} onBack={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
