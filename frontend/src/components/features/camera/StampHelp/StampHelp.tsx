import { View, Text, StyleSheet } from "react-native";
import { BottomSheet } from "@/src/components/common/BottomSheet/BottomSheet";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
};

export function StampHelp({ visible, onClose, title }: Props) {
  const { t } = useTranslation();
  const steps = [
    { number: 1, description: t("stampHelp.step1") },
    { number: 2, description: t("stampHelp.step2") },
    { number: 3, description: t("stampHelp.step3") },
  ];
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Text style={styles.title}>{title ?? t("stampHelp.title")}</Text>
        </View>
        <View style={styles.divider} />
        {steps.map((step) => (
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
