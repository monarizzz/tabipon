import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stamp, CommonButton } from '@/src/components/common';
import { colors, typography, spacing } from '@/src/theme/tokens';

type Props = {
  spotName: string;
  imageUri?: string;
  onPressDesignChange: () => void;
};

export function StampDetailPhoto({ spotName, imageUri, onPressDesignChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Stamp imageUri={imageUri} />
      <CommonButton
        label="デザインを変更する"
        onPress={onPressDesignChange}
        variant="secondary"
        icon={<Text style={styles.icon}>🎨</Text>}
      />
      <Text style={styles.spotName}>{spotName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.l,
  },
  icon: {
    fontSize: 14,
  },
  spotName: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPrimary,
  },
});
