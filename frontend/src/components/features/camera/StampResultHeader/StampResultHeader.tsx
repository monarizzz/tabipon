import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  date: string;
};

export function StampResultHeader({ date }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.badge}>✦ スタンプ獲得！ ✦</Text>
      <Text style={styles.title}>スタンプを押しました</Text>
      <Text style={styles.date}>{date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.l,
  },
  badge: {
    fontSize: typography.labelBold.fontSize,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.secondary,
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
    color: colors.textPrimary,
    textAlign: "center",
  },
  date: {
    fontSize: typography.caption.fontSize,
    color: colors.secondary,
  },
});
