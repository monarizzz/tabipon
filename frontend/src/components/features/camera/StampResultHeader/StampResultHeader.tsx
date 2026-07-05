import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/theme/tokens";

export function StampResultHeader() {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t("stampDone.badge")}</Text>
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
  title: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
    color: colors.textPrimary,
    textAlign: "center",
  },
});
