import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, LayoutChangeEvent } from 'react-native';
import Slider from '@react-native-community/slider';
import { CommonButton } from '@/src/components/common/CommonButton/CommonButton';
import { colors, typography, spacing } from '@/src/theme/tokens';

const THUMB_SIZE = 24;
const ZOOM_ICON_SIZE = 20;

type Props = {
  zoom: number;
  onChangeZoom: (value: number) => void;
  onConfirm: () => void;
};

export function PhotoAdjustControls({ zoom, onChangeZoom, onConfirm }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const thumbLeft = zoom * (trackWidth - THUMB_SIZE);

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>ピンチで拡大縮小・ドラッグで移動</Text>
      <View style={styles.sliderRow}>
        <Image source={require('@/assets/Min-Icon.png')} style={styles.zoomIcon} resizeMode="contain" />
        <View style={styles.sliderTrack} onLayout={handleTrackLayout}>
          <Slider
            style={styles.slider}
            value={zoom}
            onValueChange={onChangeZoom}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor="transparent"
          />
          {trackWidth > 0 && (
            <View pointerEvents="none" style={[styles.thumbOutline, { left: thumbLeft }]} />
          )}
        </View>
        <Image source={require('@/assets/Max-Icon.png')} style={styles.zoomIcon} resizeMode="contain" />
      </View>
      <CommonButton label="次へ" onPress={onConfirm} variant="primary" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.l,
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  hint: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  sliderTrack: {
    flex: 1,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
  },
  thumbOutline: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  zoomIcon: {
    width: ZOOM_ICON_SIZE,
    height: ZOOM_ICON_SIZE,
  },
});
