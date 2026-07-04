import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, radii, spacing } from '@/src/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function CommonButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  style,
  textStyle,
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
        <Text style={[styles.label, styles[`${variant}Label`], textStyle]}>{label}</Text>
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
  accent: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.borderSub,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  danger: {
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.xxxl,
    backgroundColor: colors.danger,
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
  accentLabel: {
    color: colors.primary,
  },
  dangerLabel: {
    color: colors.white,
  },
});
