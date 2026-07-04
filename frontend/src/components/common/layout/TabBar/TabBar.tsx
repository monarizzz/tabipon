import type { ComponentType } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

export type TabBarIcon = ComponentType<{ size?: number; color?: string }>;

export type TabBarItemData = {
  key: string;
  label: string;
  icon: TabBarIcon;
  active: boolean;
  activeColor?: string;
  onPress: () => void;
};

type Props = {
  items: TabBarItemData[];
};

export function TabBar({ items }: Props) {
  return (
    <View style={styles.container}>
      {items.map(({ key, label, icon: Icon, active, activeColor, onPress }) => {
        const color = active ? activeColor ?? colors.primary : colors.secondary;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Icon size={22} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.m,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingVertical: 8,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.tab,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.activeOverlay,
  },
  label: {
    fontSize: typography.tabLabel.fontSize,
    fontWeight: typography.tabLabel.fontWeight,
  },
});
