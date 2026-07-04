import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Slider from '@react-native-community/slider';
import { Minimize2, Maximize2 } from 'lucide-react-native';
import { CommonButton } from '@/src/components/common/CommonButton/CommonButton';
import { useTranslation } from '@/src/i18n/I18nProvider';
import { colors, typography, spacing } from '@/src/theme/tokens';

const THUMB_SIZE = 20;
const ZOOM_ICON_SIZE = 16;

type Props = {
  zoom: number;
  onChangeZoom: (value: number) => void;
  onConfirm: () => void;
};

export function PhotoAdjustControls({ zoom, onChangeZoom, onConfirm }: Props) {
  const { t } = useTranslation();
  const [trackWidth, setTrackWidth] = useState(0);

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const thumbLeft = zoom * (trackWidth - THUMB_SIZE);

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{t("photoAdjust.gestureHint")}</Text>
      <View style={styles.sliderRow}>
        <Minimize2 size={ZOOM_ICON_SIZE} color={colors.textMuted} />
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
        <Maximize2 size={ZOOM_ICON_SIZE} color={colors.textMuted} />
      </View>
      <CommonButton
        label={t("common.next")}
        onPress={onConfirm}
        variant="primary"
        style={styles.confirmButton}
        textStyle={styles.confirmButtonLabel}
      />
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
  confirmButton: {
    paddingVertical: 0,
    height: 48,
    borderRadius: 24,
  },
  confirmButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
