import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Palette } from "lucide-react-native";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  spotName: string;
  imageUri?: string;
  onPressDesignChange: () => void;
};

export function StampDetailPhoto({
  spotName,
  imageUri,
  onPressDesignChange,
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
      <Text style={styles.spotName}>{spotName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.xxl,
    paddingVertical: spacing.l,
  },
  spotName: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPrimary,
  },
});
