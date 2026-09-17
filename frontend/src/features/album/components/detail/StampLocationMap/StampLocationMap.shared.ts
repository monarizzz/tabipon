import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "@/src/style/tokens";

/**
 * `StampLocationMap.tsx`（native）と `StampLocationMap.web.tsx` の両方から
 * 読む。片方だけ直して見た目がずれるのを防ぐため、props とスタイルはここに置く
 */
export type StampLocationMapProps = {
  spotName: string;
  latitude: number | null;
  longitude: number | null;
  zoom?: number;
};

export const styles = StyleSheet.create({
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
  unavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.l,
  },
  unavailableText: {
    fontSize: typography.body.fontSize,
    color: colors.textPlaceholder,
    textAlign: "center",
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
