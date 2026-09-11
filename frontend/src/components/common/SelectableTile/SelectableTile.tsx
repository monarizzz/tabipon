import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing } from "@/src/theme/tokens";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
};

export function SelectableTile({
  label,
  selected = false,
  onPress,
  children,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.tile, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
      accessibilityLabel={label}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 67,
    height: 67,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    paddingVertical: spacing.s + 2,
    paddingHorizontal: spacing.s,
  },
  selected: {
    borderColor: colors.textMuted,
    borderWidth: 1.5,
  },
});
