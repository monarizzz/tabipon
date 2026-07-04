import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, radii, spacing, typography } from "@/src/theme/tokens";

type Props = {
  spotName: string;
  latitude: number;
  longitude: number;
  zoom?: number;
};

// 位置情報を反映した実際の地図を表示する代わりに、モックの地図画像を表示する
export function StampLocationMap({ spotName }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.mapCard}>
        <Image
          source={require("./assets/mock-map.png")}
          style={styles.map}
          resizeMode="cover"
        />
      </View>
      {spotName ? (
        <Text style={styles.spotName}>{spotName}</Text>
      ) : (
        <Text style={styles.placeholder}>{t("stampDetail.addSpotName")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.l,
    paddingVertical: spacing.l,
  },
  mapCard: {
    width: 350,
    height: 260,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  map: {
    flex: 1,
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
