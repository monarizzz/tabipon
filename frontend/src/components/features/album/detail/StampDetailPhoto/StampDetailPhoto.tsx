import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Palette, Pencil } from "lucide-react-native";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  spotName: string;
  imageUri?: string;
  onPressDesignChange: () => void;
  onPressSpotName?: () => void;
};

export function StampDetailPhoto({
  spotName,
  imageUri,
  onPressDesignChange,
  onPressSpotName,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Stamp imageUri={imageUri} />
      <CommonButton
        label="デザインを変更する"
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
          <Text style={styles.placeholder}>スポット名を追加</Text>
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
