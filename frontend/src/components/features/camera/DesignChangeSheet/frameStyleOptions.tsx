import React from 'react';
import { View } from 'react-native';
import { colors } from '@/src/theme/tokens';
import type { FrameStyleOption } from './DesignChangeSheet';

type FrameThumbVariant = 'classic' | 'vintage' | 'minimal' | 'wave';

function FrameThumb({
  variant,
  color = colors.textPlaceholder,
}: {
  variant: FrameThumbVariant;
  color?: string;
}) {
  const dot = (x: number, y: number) => (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: color,
      }}
    />
  );

  return (
    <View style={{ width: 48, height: 48 }}>
      <View
        style={{
          position: 'absolute',
          left: 2,
          top: 2,
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: variant === 'minimal' ? 1 : 2.5,
          borderColor: color,
        }}
      />
      {variant === 'vintage' && (
        <View
          style={{
            position: 'absolute',
            left: 7,
            top: 7,
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: color,
          }}
        />
      )}
      {variant === 'wave' && (
        <>
          <View
            style={{
              position: 'absolute',
              left: 6,
              top: 6,
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: color,
            }}
          />
          {dot(21, 0)}
          {dot(21, 43)}
          {dot(0, 21)}
          {dot(43, 21)}
        </>
      )}
    </View>
  );
}

function makePreview(variant: FrameThumbVariant) {
  return (selected: boolean) => (
    <FrameThumb variant={variant} color={selected ? colors.textMuted : colors.textPlaceholder} />
  );
}

export const FRAME_STYLE_OPTIONS: FrameStyleOption[] = [
  { id: 'classic', label: 'クラシック', preview: makePreview('classic') },
  { id: 'vintage', label: 'ヴィンテージ', preview: makePreview('vintage') },
  { id: 'minimal', label: 'ミニマル', preview: makePreview('minimal') },
  { id: 'wave', label: '波形', preview: makePreview('wave') },
];

export const STAMP_COLOR_OPTIONS = [
  '#333333',
  '#ff6b6b',
  '#fcc06d',
  '#6de8b9',
  '#6bc1ff',
  '#be91fa',
  '#ff94dd',
];
