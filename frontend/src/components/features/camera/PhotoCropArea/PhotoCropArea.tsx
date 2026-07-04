import { useRef, useState } from "react";
import { View, Text, Image, StyleSheet, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Defs, Mask, Rect, Circle } from "react-native-svg";
import { colors, typography } from "@/src/theme/tokens";

type Props = {
  imageUri?: string;
  size?: number;
  zoom?: number;
  onChangeZoom?: (value: number) => void;
};

const PINCH_SENSITIVITY = 1;
const SCALE_MIN = 1;
const SCALE_MAX = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PhotoCropArea({ imageUri, size = 296, zoom = 0, onChangeZoom }: Props) {
  const scale = SCALE_MIN + zoom * (SCALE_MAX - SCALE_MIN);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const maxOffsetX = (containerSize.width * (scale - 1)) / 2;
  const maxOffsetY = (containerSize.height * (scale - 1)) / 2;

  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const baseZoom = useRef(zoom);
  const baseTranslate = useRef(translate);

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
      onChangeZoom?.(clamp(next, 0, 1));
    });

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      baseTranslate.current = translate;
    })
    .onUpdate((event) => {
      setTranslate({
        x: clamp(baseTranslate.current.x + event.translationX, -maxOffsetX, maxOffsetX),
        y: clamp(baseTranslate.current.y + event.translationY, -maxOffsetY, maxOffsetY),
      });
    });

  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  const clampedTranslate = {
    x: clamp(translate.x, -maxOffsetX, maxOffsetX),
    y: clamp(translate.y, -maxOffsetY, maxOffsetY),
  };

  const cx = containerSize.width / 2;
  const cy = containerSize.height / 2;
  // 撮影画面のガイド円 (CameraPreview) と同じ算出式にして両画面の円径を一致させる
  const effectiveSize = Math.min(size, containerSize.width - 24, containerSize.height - 24);
  const radius = effectiveSize / 2;

  return (
    <View style={styles.wrap} onLayout={handleLayout}>
      {imageUri ? (
        <GestureDetector gesture={combinedGesture}>
          <Image
            source={{ uri: imageUri }}
            resizeMode="cover"
            style={[
              styles.image,
              {
                transform: [
                  { translateX: clampedTranslate.x },
                  { translateY: clampedTranslate.y },
                  { scale },
                ],
              },
            ]}
          />
        </GestureDetector>
      ) : (
        <View style={styles.placeholderWrap}>
          <Text style={styles.placeholder}>[ 撮影した写真 ]</Text>
        </View>
      )}
      {containerSize.width > 0 && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <Mask id="spotlightMask">
                <Rect x={0} y={0} width={containerSize.width} height={containerSize.height} fill="#fff" />
                <Circle cx={cx} cy={cy} r={radius} fill="#000" />
              </Mask>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={containerSize.width}
              height={containerSize.height}
              fill={colors.cropDimOverlay}
              mask="url(#spotlightMask)"
            />
          </Svg>
        </View>
      )}
      {containerSize.width > 0 && (
        <View
          pointerEvents="none"
          style={[
            styles.guide,
            {
              left: cx - radius,
              top: cy - radius,
              width: effectiveSize,
              height: effectiveSize,
              borderRadius: radius,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  guide: {
    position: "absolute",
    borderWidth: 2,
    borderColor: colors.white,
  },
  placeholderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    fontSize: typography.buttonLabel.fontSize,
    color: colors.textPlaceholder,
    textAlign: "center",
    width: 160,
  },
});
