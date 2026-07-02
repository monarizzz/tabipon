import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/tokens';

export function ScanOverlay() {
  return <View style={styles.overlay} />;
}

const styles = StyleSheet.create({
  overlay: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: 'transparent',
  },
});
