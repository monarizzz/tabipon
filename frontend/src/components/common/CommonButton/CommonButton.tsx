import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, typography, radii, spacing } from '@/src/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function CommonButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  style,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {icon}
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  primary: {
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.xxxl,
    backgroundColor: colors.primary,
  },
  secondary: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.xxxl,
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: typography.buttonLabel.fontSize,
    fontWeight: typography.labelBold.fontWeight,
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.secondary,
  },
  ghostLabel: {
    color: colors.textPrimary,
  },
});
