import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/src/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
};

export function ListItem({ label, onPress, rightElement }: Props) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Text style={styles.label}>{label}</Text>
      {rightElement && <View style={styles.right}>{rightElement}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.l,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
  },
  right: {
    marginLeft: spacing.s,
  },
});
