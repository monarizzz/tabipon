import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Pencil } from "lucide-react-native";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/style/tokens";

type Props = {
  date: string;
  location: string;
  memo?: string;
  onPressDate?: () => void;
  onPressLocation?: () => void;
  onPressMemo?: () => void;
};

// 日時 / 場所のセルはラベル 12pt ＋ 値 14pt の 2 行ぶん（約 35pt）しかない。
// 上下 8pt 広げて実効 44pt 以上にする。infoRow の padding 20pt の内側に収まるため、
// 上下に隣接する要素の判定とは重ならない。
const CELL_HIT_SLOP = { top: 8, bottom: 8 } as const;

export function StampInfoCard({
  date,
  location,
  memo,
  onPressDate,
  onPressLocation,
  onPressMemo,
}: Props) {
  const { t } = useTranslation();
  return (
    <View>
      <View style={styles.infoRow}>
        <TouchableOpacity
          style={styles.cell}
          onPress={onPressDate}
          disabled={!onPressDate}
          activeOpacity={0.7}
          hitSlop={CELL_HIT_SLOP}
          accessibilityRole={onPressDate ? "button" : undefined}
          accessibilityLabel={
            onPressDate ? t("stampDetail.editDate") : undefined
          }
        >
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t("stampDetail.labelDate")}</Text>
            {onPressDate ? <Pencil size={12} color={colors.textMuted} /> : null}
          </View>
          {date ? (
            <Text style={styles.value}>{date}</Text>
          ) : (
            <Text style={styles.placeholder}>{t("stampDetail.addDate")}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.cell}
          onPress={onPressLocation}
          disabled={!onPressLocation}
          activeOpacity={0.7}
          hitSlop={CELL_HIT_SLOP}
          accessibilityRole={onPressLocation ? "button" : undefined}
          accessibilityLabel={
            onPressLocation ? t("stampDetail.editPlace") : undefined
          }
        >
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t("stampDetail.labelPlace")}</Text>
            {onPressLocation ? (
              <Pencil size={12} color={colors.textMuted} />
            ) : null}
          </View>
          {location ? (
            <Text style={styles.value}>{location}</Text>
          ) : (
            <Text style={styles.placeholder}>{t("stampDetail.addPlace")}</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.sectionDivider} />
      <TouchableOpacity
        style={styles.memoSection}
        onPress={onPressMemo}
        disabled={!onPressMemo}
        activeOpacity={0.7}
        accessibilityRole={onPressMemo ? "button" : undefined}
        accessibilityLabel={onPressMemo ? t("stampDetail.editMemo") : undefined}
      >
        <View style={styles.labelRow}>
          <Text style={styles.label}>{t("stampDetail.labelMemo")}</Text>
          {onPressMemo ? <Pencil size={12} color={colors.textMuted} /> : null}
        </View>
        {memo ? (
          <Text style={styles.value}>{memo}</Text>
        ) : (
          <Text style={styles.placeholder}>{t("stampDetail.addMemo")}</Text>
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
