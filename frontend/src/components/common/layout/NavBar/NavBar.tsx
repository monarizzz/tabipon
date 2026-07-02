import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, radii, spacing } from '@/src/theme/tokens';

type Props = {
  title: string;
  onBack?: () => void;
  backIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
};

export function NavBar({ title, onBack, backIcon, rightIcon, onRightPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.l }]}>
      {onBack ? (
        <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.7}>
          {backIcon ?? <Text style={styles.iconGlyph}>‹</Text>}
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButtonPlaceholder} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {rightIcon ? (
        <TouchableOpacity style={styles.iconButton} onPress={onRightPress} activeOpacity={0.7}>
          {rightIcon}
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButtonPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.l,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.navTitle.fontSize,
    fontWeight: typography.navTitle.fontWeight,
    color: colors.textPrimary,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radii.tab,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPlaceholder: {
    width: 32,
    height: 32,
  },
  iconGlyph: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
