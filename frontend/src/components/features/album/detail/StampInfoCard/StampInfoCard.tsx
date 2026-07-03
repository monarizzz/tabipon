import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  date: string;
  location: string;
  memo?: string;
};

export function StampInfoCard({ date, location, memo }: Props) {
  return (
    <View>
      <View style={styles.infoRow}>
        <View style={styles.cell}>
          <Text style={styles.label}>日付</Text>
          <Text style={styles.value}>{date}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <Text style={styles.label}>場所</Text>
          <Text style={styles.value}>{location}</Text>
        </View>
      </View>
      {memo ? (
        <>
          <View style={styles.sectionDivider} />
          <View style={styles.memoSection}>
            <Text style={styles.label}>メモ</Text>
            <Text style={styles.value}>{memo}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    padding: spacing.xl,
  },
  cell: {
    flex: 1,
    gap: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xl,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  memoSection: {
    gap: spacing.s,
    padding: spacing.xl,
  },
  label: {
    fontSize: typography.labelBold.fontSize,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textPrimary,
  },
  value: {
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
});
