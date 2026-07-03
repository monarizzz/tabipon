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
  preview: (selected: boolean) => React.ReactNode;
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
    <BottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['50%']}
      contentPaddingBottom={spacing.xxxl}
    >
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
        <Toggle value={showLandmarkName} onValueChange={onToggleShowLandmarkName} />
      </View>

      <CommonButton
        label="このデザインにする"
        onPress={onConfirm}
        variant="primary"
        style={styles.confirmButton}
        textStyle={styles.confirmLabel}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    gap: spacing.m,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
