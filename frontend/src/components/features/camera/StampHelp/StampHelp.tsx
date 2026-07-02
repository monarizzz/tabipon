import { View, Text, StyleSheet } from "react-native";
import { colors, typography, radii, spacing } from "@/src/theme/tokens";

type Step = {
  number: number;
  description: string;
};

const STEPS: Step[] = [
  { number: 1, description: "スマホを上に持ち上げる" },
  { number: 2, description: "振り下げる" },
  { number: 3, description: "ぐっと押し込む" },
];

type Props = {
  visible: boolean;
  title?: string;
};

export function StampHelp({ visible, title = "スタンプの押し方" }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.divider} />
      {STEPS.map((step) => (
        <View key={step.number} style={styles.step}>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{step.number}</Text>
          </View>
          <Text style={styles.description}>{step.description}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.button,
    borderTopRightRadius: radii.button,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.l,
    paddingBottom: spacing.xxl,
    gap: spacing.l,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    alignItems: "center",
  },
  title: {
    fontSize: typography.buttonLabel.fontSize + 3,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary,
  },
  description: {
    fontSize: typography.buttonLabel.fontSize,
    color: colors.textPrimary,
  },
});
