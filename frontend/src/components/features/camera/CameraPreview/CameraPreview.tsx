import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, type LayoutChangeEvent } from "react-native";
import { CameraView, type CameraType, type FlashMode } from "expo-camera";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { colors, typography } from "@/src/theme/tokens";

type Props = {
  facing: CameraType;
  flash: FlashMode;
  guideSize?: number;
};

const PINCH_SENSITIVITY = 1;
// expo-cameraのzoom(0〜1)には実倍率の概念がないため、表示用に「0.5x（最小）〜1.0x（初期値）〜5.0x（最大）」相当へ変換する
const DISPLAY_ZOOM_MIN = 0.5;
const DISPLAY_ZOOM_MAX = 5;
const DISPLAY_ZOOM_DEFAULT = 1;
const DEFAULT_ZOOM =
  (DISPLAY_ZOOM_DEFAULT - DISPLAY_ZOOM_MIN) / (DISPLAY_ZOOM_MAX - DISPLAY_ZOOM_MIN);

export const CameraPreview = React.forwardRef<CameraView, Props>(
  ({ facing, flash, guideSize = 296 }, ref) => {
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    const baseZoom = useRef(DEFAULT_ZOOM);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const handleLayout = (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setContainerSize({ width, height });
    };

    const pinchGesture = Gesture.Pinch()
      .runOnJS(true)
      .onStart(() => {
        baseZoom.current = zoom;
      })
      .onUpdate((event) => {
        const next = baseZoom.current + (event.scale - 1) * PINCH_SENSITIVITY;
        setZoom(Math.min(1, Math.max(0, next)));
      });

    const effectiveGuideSize = Math.min(
      guideSize,
      containerSize.width - 24,
      containerSize.height - 24
    );
    const displayZoom = (
      DISPLAY_ZOOM_MIN +
      zoom * (DISPLAY_ZOOM_MAX - DISPLAY_ZOOM_MIN)
    ).toFixed(1);

    return (
      <View style={styles.wrap} onLayout={handleLayout}>
        {containerSize.width > 0 && (
          <GestureDetector gesture={pinchGesture}>
            <View style={styles.frame}>
              <CameraView
                ref={ref}
                style={styles.camera}
                facing={facing}
                flash={flash}
                zoom={zoom}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.guide,
                  {
                    width: effectiveGuideSize,
                    height: effectiveGuideSize,
                    borderRadius: effectiveGuideSize / 2,
                  },
                ]}
              />
              <View pointerEvents="none" style={[styles.zoomBadge, { marginTop: 12 }]}>
                <Text style={styles.zoomBadgeText}>{displayZoom}x</Text>
              </View>
            </View>
          </GestureDetector>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  guide: {
    borderWidth: 2,
    borderColor: colors.white,
  },
  zoomBadge: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zoomBadgeText: {
    fontSize: typography.caption.fontSize,
    color: colors.white,
    fontWeight: "600",
  },
});
