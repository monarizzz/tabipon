import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  label: string;
  icon?: LucideIcon;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
};

export function ListItem({
  label,
  icon: Icon,
  onPress,
  rightElement,
  showChevron,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.left}>
        {Icon && <Icon size={18} color={colors.textMuted} />}
        <Text style={styles.label}>{label}</Text>
      </View>
      {rightElement && <View style={styles.right}>{rightElement}</View>}
      {!rightElement && showChevron && (
        <ChevronRight size={16} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: spacing.l,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
  },
  label: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
  },
  right: {
    marginLeft: spacing.s,
  },
});
