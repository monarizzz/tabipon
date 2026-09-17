import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { Pencil } from "lucide-react-native";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/style/tokens";

type Props = {
  spotName: string;
  onPress?: () => void;
};

// 行の高さは fontSize 18 の行高ぶん（約 22pt）しかない。
// 上下 12pt 広げて、見た目を変えずに実効 44pt 以上を確保する。
const HIT_SLOP = { top: 12, bottom: 12 } as const;

export function SpotNameLabel({ spotName, onPress }: Props) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      hitSlop={HIT_SLOP}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? t("stampDetail.editTitle") : undefined}
    >
      {spotName ? (
        <Text style={styles.spotName}>{spotName}</Text>
      ) : (
        <Text style={styles.placeholder}>{t("stampDetail.addSpotName")}</Text>
      )}
      {onPress ? <Pencil size={14} color={colors.textMuted} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
  },
  spotName: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPrimary,
  },
  placeholder: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPlaceholder,
  },
});
