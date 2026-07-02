import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/src/theme/tokens';

type Props = {
  name: string;
  registeredDate: string;
  avatarUri?: string;
};

export function ProfileSection({ name, registeredDate, avatarUri }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.avatar}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarGlyph}>👤</Text>
        )}
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.bio}>{registeredDate} 登録</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.m,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGlyph: {
    fontSize: 32,
  },
  name: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPrimary,
  },
  bio: {
    fontSize: typography.caption.fontSize,
    color: colors.textPlaceholder,
  },
});
