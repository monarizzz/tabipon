import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, radii, spacing, typography } from "@/src/theme/tokens";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type Props = {
  spotName: string;
  latitude: number | null;
  longitude: number | null;
  zoom?: number;
};

function buildMapHtml(lat: number, lon: number, zoom: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; }
  html, body, #map { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  function initMap() {
    var pos = { lat: ${lat}, lng: ${lon} };
    var map = new google.maps.Map(document.getElementById('map'), {
      center: pos,
      zoom: ${zoom},
      disableDefaultUI: true,
      gestureHandling: 'greedy'
    });
    new google.maps.Marker({ position: pos, map: map });
  }
</script>
<script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap" async defer></script>
</body>
</html>`;
}

export function StampLocationMap({
  spotName,
  latitude,
  longitude,
  zoom = 15,
}: Props) {
  const { t } = useTranslation();

  const hasLocation =
    latitude !== null &&
    longitude !== null &&
    !(latitude === 0 && longitude === 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.mapCard}>
        {hasLocation ? (
          <WebView
            source={{ html: buildMapHtml(latitude!, longitude!, zoom) }}
            style={styles.map}
            scrollEnabled={false}
            originWhitelist={["*"]}
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
