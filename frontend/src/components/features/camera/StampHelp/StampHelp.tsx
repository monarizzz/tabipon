import { View, Text, StyleSheet } from "react-native";
import { BottomSheet } from "@/src/components/common/BottomSheet/BottomSheet";
import { colors, typography, spacing } from "@/src/theme/tokens";

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
  onClose: () => void;
  title?: string;
};

export function StampHelp({ visible, onClose, title = "スタンプの押し方" }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.wrap}>
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
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.l,
    gap: spacing.l,
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
