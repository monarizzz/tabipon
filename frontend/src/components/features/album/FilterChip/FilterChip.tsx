import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors, typography, radii } from "@/src/theme/tokens";

type Props = {
  label: string;
  selected?: boolean;
  variant?: "filter" | "add";
  onPress?: () => void;
};

export function FilterChip({
  label,
  selected = false,
  variant = "filter",
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          variant === "add" ? styles.addLabel : styles.label,
          selected && styles.labelSelected,
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 65,
    height: 65,
    borderRadius: radii.tab,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: colors.borderSub,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textPrimary,
    textAlign: "center",
  },
  labelSelected: {
    fontSize: typography.labelBold.fontSize,
    color: colors.primary,
  },
  addLabel: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.textPlaceholder,
  },
});
