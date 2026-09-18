import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { Pencil } from "lucide-react-native";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/style/tokens";

type Props = {
  spotName: string;
  onPress?: () => void;
};

export function SpotNameLabel({ spotName, onPress }: Props) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {spotName ? (
        <Text style={styles.spotName} numberOfLines={1} ellipsizeMode="tail">
          {spotName}
        </Text>
      ) : (
        <Text style={styles.placeholder} numberOfLines={1} ellipsizeMode="tail">
          {t("stampDetail.addSpotName")}
        </Text>
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
    // 親が alignItems: "center" だと行の幅は中身なりに決まり、親をはみ出しても
    // 縮まない。上限を親の内側に合わせて、名前側の flexShrink を効かせる
    maxWidth: "100%",
  },
  spotName: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPrimary,
    // 鉛筆アイコンを押し出さないよう、あふれる分は名前側だけを縮める
    flexShrink: 1,
  },
  placeholder: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPlaceholder,
    flexShrink: 1,
  },
});
