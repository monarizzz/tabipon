import React from 'react';
import { View } from 'react-native';
import { colors } from '@/src/theme/tokens';
import type { StampColor, StampFrame } from '@/src/api/stamps';
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
          borderStyle: variant === 'vintage' ? 'dashed' : 'solid',
        }}
      />
      {/* API上の classic (二重丸) に対応するプレビュー */}
      {variant === 'classic' && (
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
  // 返しているのは props ではなく selected: boolean を受け取る描画関数(render prop)。
  // React コンポーネントではないので displayName は付けられない
  // eslint-disable-next-line react/display-name
  return (selected: boolean) => (
    <FrameThumb variant={variant} color={selected ? colors.textMuted : colors.textPlaceholder} />
  );
}

export const FRAME_STYLE_OPTIONS: FrameStyleOption[] = [
  { id: 'classic', label: 'design.frameClassic', preview: makePreview('classic') },
  { id: 'vintage', label: 'design.frameVintage', preview: makePreview('vintage') },
  { id: 'minimal', label: 'design.frameMinimal', preview: makePreview('minimal') },
  { id: 'wave', label: 'design.frameWave', preview: makePreview('wave') },
];

// バックエンドの StampColor (red/blue/black/green) に対応する4色のみ提供する
// 先頭(デフォルト選択)は POST 時のデフォルト色 red に合わせる
export const STAMP_COLOR_OPTIONS = [
  '#ff6b6b',
  '#6bc1ff',
  '#333333',
  '#6de8b9',
];

export const API_COLOR_BY_HEX: Record<string, StampColor> = {
  '#ff6b6b': 'red',
  '#6bc1ff': 'blue',
  '#333333': 'black',
  '#6de8b9': 'green',
};

export const API_FRAME_BY_ID: Record<string, StampFrame> = {
  'classic': 'classic',
  'vintage': 'dash',
  'minimal': 'simple',
  'wave': 'wave',
};

// 保存済み color(api値) からスウォッチの hex を逆引きする(デザイン変更パネルの初期選択用)
export const HEX_BY_API_COLOR: Record<StampColor, string> = {
  red: '#ff6b6b',
  blue: '#6bc1ff',
  black: '#333333',
  green: '#6de8b9',
};

// 保存済み frame(api値) からフレームスタイル id を逆引きする
export const FRAME_ID_BY_API: Record<StampFrame, string> = {
  classic: 'classic',
  dash: 'vintage',
  simple: 'minimal',
  wave: 'wave',
};
