import type { ComponentType } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

export type TabBarIcon = ComponentType<{ size?: number; color?: string }>;

export type TabBarItemData = {
  key: string;
  label: string;
  icon: TabBarIcon;
  active: boolean;
  onPress: () => void;
};

type Props = {
  items: TabBarItemData[];
};

export function TabBar({ items }: Props) {
  return (
    <View style={styles.container}>
      {items.map(({ key, label, icon: Icon, active, onPress }) => (
        <TouchableOpacity
          key={key}
          style={[styles.tab, active && styles.tabActive]}
          onPress={onPress}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
        >
          <Icon size={22} color={active ? colors.primary : colors.secondary} />
          <Text style={[styles.label, { color: active ? colors.primary : colors.secondary }]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.m,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.l,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingVertical: spacing.m,
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
