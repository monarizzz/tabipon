import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { colors, typography, spacing } from "@/src/theme/tokens";

export default function StampDoneScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>スタンプを押しました！</Text>
      <CommonButton
        label="アルバムへ"
        onPress={() => router.push("/(tabs)/album")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
  },
  title: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
    color: colors.textPrimary,
  },
});
