import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Pencil } from "lucide-react-native";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  date: string;
  location: string;
  memo?: string;
  onPressDate?: () => void;
  onPressLocation?: () => void;
  onPressMemo?: () => void;
};

export function StampInfoCard({
  date,
  location,
  memo,
  onPressDate,
  onPressLocation,
  onPressMemo,
}: Props) {
  return (
    <View>
      <View style={styles.infoRow}>
        <TouchableOpacity
          style={styles.cell}
          onPress={onPressDate}
          disabled={!onPressDate}
          activeOpacity={0.7}
        >
          <View style={styles.labelRow}>
            <Text style={styles.label}>日付</Text>
            {onPressDate ? <Pencil size={12} color={colors.textMuted} /> : null}
          </View>
          {date ? (
            <Text style={styles.value}>{date}</Text>
          ) : (
            <Text style={styles.placeholder}>日付を追加</Text>
          )}
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.cell}
          onPress={onPressLocation}
          disabled={!onPressLocation}
          activeOpacity={0.7}
        >
          <View style={styles.labelRow}>
            <Text style={styles.label}>場所</Text>
            {onPressLocation ? <Pencil size={12} color={colors.textMuted} /> : null}
          </View>
          {location ? (
            <Text style={styles.value}>{location}</Text>
          ) : (
            <Text style={styles.placeholder}>場所を追加</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.sectionDivider} />
      <TouchableOpacity
        style={styles.memoSection}
        onPress={onPressMemo}
        disabled={!onPressMemo}
        activeOpacity={0.7}
      >
        <View style={styles.labelRow}>
          <Text style={styles.label}>メモ</Text>
          {onPressMemo ? <Pencil size={12} color={colors.textMuted} /> : null}
        </View>
        {memo ? (
          <Text style={styles.value}>{memo}</Text>
        ) : (
          <Text style={styles.placeholder}>メモを追加</Text>
        )}
      </TouchableOpacity>
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
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
  placeholder: {
    fontSize: typography.body.fontSize,
    color: colors.textPlaceholder,
  },
});
