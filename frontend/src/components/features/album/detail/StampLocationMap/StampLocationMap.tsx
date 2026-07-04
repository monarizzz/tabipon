import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, radii, spacing, typography } from "@/src/theme/tokens";

type Props = {
  spotName: string;
  latitude: number | null;
  longitude: number | null;
  zoom?: number;
};

function buildStaticMapUrl(lat: number, lon: number, zoom: number): string {
  const width = 700;
  const height = 520;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lon},red-pushpin`;
}

export function StampLocationMap({ spotName, latitude, longitude, zoom = 15 }: Props) {
  const { t } = useTranslation();

  const hasLocation = latitude !== null && longitude !== null && !(latitude === 0 && longitude === 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.mapCard}>
        {hasLocation ? (
          <Image
            source={{ uri: buildStaticMapUrl(latitude!, longitude!, zoom) }}
            style={styles.map}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={require("./assets/mock-map.png")}
            style={styles.map}
            resizeMode="cover"
          />
        )}
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
