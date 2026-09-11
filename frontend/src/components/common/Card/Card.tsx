import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, radii, spacing } from "@/src/theme/tokens";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: spacing.l,
  },
});
