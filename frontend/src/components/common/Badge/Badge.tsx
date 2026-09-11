import { View, Text, StyleSheet } from "react-native";
import { colors, typography, radii, spacing } from "@/src/theme/tokens";

type Props = {
  label: string;
  color?: string;
};

export function Badge({ label, color = colors.primary }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "22" }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
    borderRadius: radii.hint,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.labelBold.fontWeight,
  },
});
