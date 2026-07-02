import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheet } from '@/src/components/common/BottomSheet/BottomSheet';
import { SelectableTile } from '@/src/components/common/SelectableTile/SelectableTile';
import { ColorSwatch } from '@/src/components/common/ColorSwatch/ColorSwatch';
import { Toggle } from '@/src/components/common/Toggle/Toggle';
import { CommonButton } from '@/src/components/common/CommonButton/CommonButton';
import { colors, typography, spacing } from '@/src/theme/tokens';

export type FrameStyleOption = {
  id: string;
  label: string;
  preview: React.ReactNode;
};

type Props = {
  visible: boolean;
  onClose: () => void;
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

export function DesignChangeSheet({
  visible,
  onClose,
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
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>フレーム</Text>
        <View style={styles.row}>
          {frameStyles.map((style) => (
            <SelectableTile
              key={style.id}
              label={style.label}
              selected={style.id === selectedFrameStyleId}
              onPress={() => onSelectFrameStyle(style.id)}
            >
              {style.preview}
            </SelectableTile>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>カラー</Text>
        <View style={styles.row}>
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
        <Toggle value={showLandmarkName} onValueChange={onToggleShowLandmarkName} />
      </View>

      <CommonButton label="このデザインにする" onPress={onConfirm} variant="primary" />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.labelBold.fontSize,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.l,
    backgroundColor: colors.surface,
    borderRadius: spacing.m,
    marginBottom: spacing.xl,
  },
  toggleLabel: {
    fontSize: typography.labelBold.fontSize,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textPrimary,
  },
});
