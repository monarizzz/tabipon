import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Palette, Pencil } from "lucide-react-native";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  spotName: string;
  imageUri?: string;
  loading?: boolean;
  onPressDesignChange: () => void;
  onPressSpotName?: () => void;
};

export function StampDetailPhoto({
  spotName,
  imageUri,
  loading,
  onPressDesignChange,
  onPressSpotName,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View>
        <Stamp imageUri={imageUri} />
        {loading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      </View>
      <CommonButton
        label={t("design.changeDesign")}
        onPress={onPressDesignChange}
        variant="secondary"
        icon={<Palette size={14} color={colors.secondary} />}
      />
      <TouchableOpacity
        style={styles.spotNameRow}
        onPress={onPressSpotName}
        disabled={!onPressSpotName}
        activeOpacity={0.7}
      >
        {spotName ? (
          <Text style={styles.spotName}>{spotName}</Text>
        ) : (
          <Text style={styles.placeholder}>{t("stampDetail.addSpotName")}</Text>
        )}
        {onPressSpotName ? (
          <Pencil size={14} color={colors.textMuted} />
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.xxl,
    paddingVertical: spacing.l,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  spotNameRow: {
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
