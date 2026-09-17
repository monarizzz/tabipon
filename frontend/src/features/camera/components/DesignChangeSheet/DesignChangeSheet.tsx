import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BottomSheet } from "@/src/commons/sheet/components/BottomSheet/BottomSheet";
import { SelectableTile } from "@/src/commons/other/components/SelectableTile/SelectableTile";
import { ColorSwatch } from "@/src/commons/other/components/ColorSwatch/ColorSwatch";
import { Toggle } from "@/src/commons/other/components/Toggle/Toggle";
import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { FrameThumb } from "@/src/commons/stamp/components/FrameThumb/FrameThumb";
import type { FrameStyleOption } from "@/src/commons/stamp/types/frameStyleOption";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/style/tokens";
import type { StampFrame } from "@/src/utils/stamp/types/stampFrame";

type Props = {
  visible: boolean;
  onClose: () => void;
  frameStyles: FrameStyleOption[];
  selectedFrameStyleId: StampFrame;
  onSelectFrameStyle: (id: StampFrame) => void;
  colorOptions: readonly string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  showLandmarkName: boolean;
  onToggleShowLandmarkName: (value: boolean) => void;
  onConfirm: () => void;
};

export function DesignChangeSheet({
  visible,
  onClose,
  frameStyles,
  selectedFrameStyleId,
  onSelectFrameStyle,
  colorOptions,
  selectedColor,
  onSelectColor,
  showLandmarkName,
  onToggleShowLandmarkName,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={["50%"]}
      contentPaddingBottom={spacing.xxxl}
    >
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("design.frame")}</Text>
        <View style={styles.row}>
          {frameStyles.map((style) => {
            const selected = style.id === selectedFrameStyleId;
            return (
              <SelectableTile
                key={style.id}
                label={t(style.label)}
                selected={selected}
                onPress={() => onSelectFrameStyle(style.id)}
              >
                <FrameThumb variant={style.id} selected={selected} />
              </SelectableTile>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("design.color")}</Text>
        <View style={styles.colorRow}>
          {colorOptions.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              selected={color === selectedColor}
              onPress={() => onSelectColor(color)}
            />
          ))}
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{t("design.showLandmark")}</Text>
        <Toggle
          value={showLandmarkName}
          onValueChange={onToggleShowLandmarkName}
        />
      </View>

      <CommonButton
        label={t("design.apply")}
        onPress={onConfirm}
        variant="primary"
        style={styles.confirmButton}
        textStyle={styles.confirmLabel}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.m,
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: spacing.l,
    marginBottom: spacing.xl,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textPrimary,
  },
  confirmButton: {
    height: 52,
    borderRadius: 26,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
});
