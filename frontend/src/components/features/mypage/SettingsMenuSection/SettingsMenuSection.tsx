import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, ListItem } from '@/src/components/common';
import { colors, radii } from '@/src/theme/tokens';

export type SettingsMenuItem = {
  id: string;
  label: string;
  onPress: () => void;
};

type Props = {
  items: SettingsMenuItem[];
};

export function SettingsMenuSection({ items }: Props) {
  return (
    <Card style={styles.card}>
      {items.map((item) => (
        <ListItem key={item.id} label={item.label} onPress={item.onPress} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
});
