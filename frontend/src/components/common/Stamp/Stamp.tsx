import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/tokens';

type Props = {
  imageUri?: string;
  size?: number;
  muted?: boolean;
};

export function Stamp({ imageUri, size = 260, muted = false }: Props) {
  const outerRingSize = size * 1.258;
  const innerRingSize = size * 1.154;

  if (imageUri) {
    return (
      <View style={[styles.wrap, { width: outerRingSize, height: outerRingSize }]}>
        <View
          style={[
            styles.content,
            {
              width: outerRingSize,
              height: outerRingSize,
              borderRadius: outerRingSize / 2,
            },
          ]}
        >
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: outerRingSize, height: outerRingSize }]}>
      <View
        style={[
          styles.ring,
          {
            width: outerRingSize,
            height: outerRingSize,
            borderRadius: outerRingSize / 2,
            top: 0,
            left: 0,
          },
        ]}
      />
      <View
        style={[
          styles.ring,
          styles.innerRing,
          {
            width: innerRingSize,
            height: innerRingSize,
            borderRadius: innerRingSize / 2,
            top: (outerRingSize - innerRingSize) / 2,
            left: (outerRingSize - innerRingSize) / 2,
          },
        ]}
      />
      <View
        style={[
          styles.content,
          { width: size, height: size, borderRadius: size / 2 },
          muted && styles.contentMuted,
        ]}
      >
        {muted ? null : <Text style={styles.placeholder}>[撮影した画像]</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  innerRing: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentMuted: {
    backgroundColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPlaceholder,
    textAlign: 'center',
    width: 200,
  },
});
