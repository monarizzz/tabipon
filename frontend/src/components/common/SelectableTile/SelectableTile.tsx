import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '@/src/theme/tokens';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
};

export function SelectableTile({ label, selected = false, onPress, children }: Props) {
  return (
    <TouchableOpacity
      style={[styles.tile, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      {children}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 67,
    gap: spacing.s,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: spacing.s,
  },
  selected: {
    borderColor: colors.textMuted,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
