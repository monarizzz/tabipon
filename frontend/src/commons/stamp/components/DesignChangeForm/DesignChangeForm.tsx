import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { ColorSwatch } from "@/src/commons/other/components/ColorSwatch/ColorSwatch";
import { SelectableTile } from "@/src/commons/other/components/SelectableTile/SelectableTile";
import { FrameThumb } from "@/src/commons/stamp/components/FrameThumb/FrameThumb";
import type { FrameStyleOption } from "@/src/commons/stamp/types/frameStyleOption";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/style/tokens";
import type { StampFrame } from "@/src/utils/stamp/types/stampFrame";

type Props = {
  frameStyles: FrameStyleOption[];
  selectedFrameStyleId: StampFrame;
  onSelectFrameStyle: (id: StampFrame) => void;
  colorOptions: readonly string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onConfirm: () => void;
  confirming?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * デザイン変更の入力部（枠・色・適用ボタン）。
 * 外枠と中身の分け方は docs/front-architecture.md「外枠は features、中身は commons」を参照。
 */
export function DesignChangeForm({
  frameStyles,
  selectedFrameStyleId,
  onSelectFrameStyle,
  colorOptions,
  selectedColor,
  onSelectColor,
  onConfirm,
  confirming,
  style,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={style}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("design.frame")}</Text>
        <View style={styles.row}>
          {frameStyles.map((frameStyle) => {
            const selected = frameStyle.id === selectedFrameStyleId;
            return (
              <SelectableTile
                key={frameStyle.id}
                label={t(frameStyle.label)}
                selected={selected}
                onPress={() => onSelectFrameStyle(frameStyle.id)}
              >
                <FrameThumb variant={frameStyle.id} selected={selected} />
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

      <CommonButton
        label={t("design.apply")}
        onPress={onConfirm}
        variant="primary"
        disabled={confirming}
        icon={
          confirming ? <ActivityIndicator color={colors.white} /> : undefined
        }
        style={styles.confirmButton}
        textStyle={styles.confirmLabel}
      />
    </View>
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
  confirmButton: {
    height: 52,
    borderRadius: 26,
    // 余白のある外枠（全画面パネル）では下端に寄せる。高さが余らない場合は効かない
    marginTop: "auto",
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
});
