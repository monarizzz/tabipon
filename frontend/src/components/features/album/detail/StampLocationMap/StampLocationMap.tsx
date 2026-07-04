import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { colors, radii, spacing, typography } from "@/src/theme/tokens";

type Props = {
  spotName: string;
  latitude: number;
  longitude: number;
  zoom?: number;
};

export function StampLocationMap({
  spotName,
  latitude,
  longitude,
  zoom = 15,
}: Props) {
  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`;
  // Google の embed 用エンドポイントは iframe 経由でのみ許可されるため、
  // WebView で直接 URL に遷移せず、iframe を含む HTML をラップして読み込む
  const mapHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body,iframe{margin:0;padding:0;width:100%;height:100%;border:0;}</style></head><body><iframe src="${mapUrl}"></iframe></body></html>`;

  return (
    <View style={styles.wrap}>
      <View style={styles.mapCard}>
        <WebView style={styles.map} source={{ html: mapHtml }} />
      </View>
      <Text style={styles.spotName}>{spotName}</Text>
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
});
