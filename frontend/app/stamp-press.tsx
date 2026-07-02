import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { CommonButton, NavBar, Stamp } from "@/src/components/common";
import { StampHelp } from "@/src/components/features/camera/StampHelp";
import { colors, typography, spacing } from "@/src/theme/tokens";

export default function StampPressScreen() {
  const router = useRouter();
  const [helpVisible, setHelpVisible] = React.useState(false);

  return (
    <View style={styles.container}>
      <NavBar
        title="スタンプを押す"
        onBack={() => router.back()}
        rightIcon={<Text style={styles.helpIcon}>？</Text>}
        onRightPress={() => setHelpVisible((visible) => !visible)}
      />
      <View style={styles.content}>
        <Stamp />
        <Text style={styles.hint}>スマホを上下に振ってスタンプ！</Text>
        <CommonButton label="押す" onPress={() => router.push("/stamp-done")} />
      </View>
      <StampHelp visible={helpVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
  },
  hint: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  helpIcon: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
