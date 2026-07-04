import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/src/theme/tokens";

type Props = {
  spotName: string;
  latitude: number;
  longitude: number;
  zoom?: number;
};

// 位置情報を反映した実際の地図を表示する代わりに、モックの地図画像を表示する
export function StampLocationMap({ spotName }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mapCard}>
        <Image
          source={require("./assets/mock-map.png")}
          style={styles.map}
          resizeMode="cover"
        />
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
