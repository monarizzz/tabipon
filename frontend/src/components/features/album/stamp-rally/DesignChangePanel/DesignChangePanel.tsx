import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SelectableTile } from "@/src/components/common/SelectableTile/SelectableTile";
import { ColorSwatch } from "@/src/components/common/ColorSwatch/ColorSwatch";
import { Toggle } from "@/src/components/common/Toggle/Toggle";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { ShareButton } from "@/src/components/common/ShareButton/ShareButton";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { colors, radii, typography, spacing } from "@/src/theme/tokens";
import type { FrameStyleOption } from "@/src/components/features/camera/DesignChangeSheet/DesignChangeSheet";

type Props = {
  onBack: () => void;
  onShare?: () => void;
  imageUri?: string;
  frameStyles: FrameStyleOption[];
  selectedFrameStyleId: string;
  onSelectFrameStyle: (id: string) => void;
  colorOptions: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  showLandmarkName: boolean;
  onToggleShowLandmarkName: (value: boolean) => void;
  onConfirm: () => void;
};

export function DesignChangePanel({
  onBack,
  onShare,
  imageUri,
  frameStyles,
  selectedFrameStyleId,
  onSelectFrameStyle,
  colorOptions,
  selectedColor,
  onSelectColor,
  showLandmarkName,
  onToggleShowLandmarkName,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xl }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.iconGlyph}>‹</Text>
        </TouchableOpacity>
        <ShareButton onPress={onShare} size={44} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewArea}>
          <Stamp imageUri={imageUri} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>フレーム</Text>
          <View style={styles.row}>
            {frameStyles.map((style) => {
              const selected = style.id === selectedFrameStyleId;
              return (
                <SelectableTile
                  key={style.id}
                  label={style.label}
                  selected={selected}
                  onPress={() => onSelectFrameStyle(style.id)}
                >
                  {style.preview(selected)}
                </SelectableTile>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>カラー</Text>
          <View style={styles.colorRow}>
            {colorOptions.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                selected={color === selectedColor}
                onPress={() => onSelectColor(color)}
              />
            ))}
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>ランドマーク名を表示</Text>
          <Toggle
            value={showLandmarkName}
            onValueChange={onToggleShowLandmarkName}
          />
        </View>

        <CommonButton
          label="このデザインにする"
          onPress={onConfirm}
          variant="primary"
          style={styles.confirmButton}
          textStyle={styles.confirmLabel}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.tab,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlyph: {
    fontSize: 16,
    color: colors.textMuted,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  previewArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.l,
  },
  section: {
    gap: 12,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.m,
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: spacing.l,
    marginBottom: spacing.xl,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textPrimary,
  },
  confirmButton: {
    height: 52,
    borderRadius: 26,
    marginTop: "auto",
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
});
