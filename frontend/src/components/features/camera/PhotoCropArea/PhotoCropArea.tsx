import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View, Text, Image, StyleSheet, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Defs, Mask, Rect, Circle } from "react-native-svg";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { colors, typography } from "@/src/theme/tokens";

type Props = {
  imageUri?: string;
  size?: number;
  zoom?: number;
  onChangeZoom?: (value: number) => void;
};

export type PhotoCropAreaHandle = {
  /** 円ガイド内に実際に見えている範囲だけを正方形で切り出した画像の URI を返す */
  getCroppedImageUri: () => Promise<string | null>;
};

const PINCH_SENSITIVITY = 1;
const SCALE_MIN = 1;
const SCALE_MAX = 3;
// 円ガイドとぴったり同じ大きさにフィットさせると、画像とガイドのアスペクト比が異なる限り
// 必ずどちらか一方の軸の余白が0になり、その方向にパンできなくなる。最小ズームでも上下左右
// どちらにも少し動かせるよう、フィットサイズより少し大きく表示しておくための倍率。
const BASE_OVERSCAN = 1.15;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export const PhotoCropArea = forwardRef<PhotoCropAreaHandle, Props>(function PhotoCropArea(
  { imageUri, size = 296, zoom = 0, onChangeZoom },
  ref
) {
  const scale = SCALE_MIN + zoom * (SCALE_MAX - SCALE_MIN);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!imageUri) {
      setImageNaturalSize({ width: 0, height: 0 });
      return;
    }
    let cancelled = false;
    Image.getSize(
      imageUri,
      (width, height) => {
        if (!cancelled) setImageNaturalSize({ width, height });
      },
      () => {
        if (!cancelled) setImageNaturalSize({ width: 0, height: 0 });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [imageUri]);

  // 撮影画面のガイド円 (CameraPreview) と同じ算出式にして両画面の円径を一致させる
  const effectiveSize = Math.min(size, containerSize.width - 24, containerSize.height - 24);

  // クロップ結果として実際に使われるのは中央の円形ガイドだけなので、その円を常に覆えるサイズを
  // 画像の実寸(アスペクト比)から計算する。resizeMode="cover" の自動クロップに任せると、
  // クロップ後のテクスチャを拡大するだけになってしまい、写真本来の端まで見せられないため、
  // ここで実寸ベースの幅・高さを明示的に指定する。
  let baseWidth = effectiveSize;
  let baseHeight = effectiveSize;
  let fitScale = 1;
  if (imageNaturalSize.width > 0 && imageNaturalSize.height > 0 && effectiveSize > 0) {
    fitScale =
      Math.max(effectiveSize / imageNaturalSize.width, effectiveSize / imageNaturalSize.height) *
      BASE_OVERSCAN;
    baseWidth = imageNaturalSize.width * fitScale;
    baseHeight = imageNaturalSize.height * fitScale;
  }

  const maxOffsetX = Math.max(0, (baseWidth * scale - effectiveSize) / 2);
  const maxOffsetY = Math.max(0, (baseHeight * scale - effectiveSize) / 2);

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

  useImperativeHandle(
    ref,
    () => ({
      getCroppedImageUri: async () => {
        if (!imageUri || imageNaturalSize.width <= 0 || imageNaturalSize.height <= 0 || effectiveSize <= 0) {
          return null;
        }
        // 画面上の円ガイド(半径 radius, 中心が画像中心からズレる量が translate/scale)を
        // 表示用の座標変換の逆算で元画像のピクセル座標に戻し、その正方形だけを切り出す。
        const radius = effectiveSize / 2;
        const cropSize = (2 * radius) / (scale * fitScale);
        const centerX =
          imageNaturalSize.width / 2 - clampedTranslate.x / (scale * fitScale);
        const centerY =
          imageNaturalSize.height / 2 - clampedTranslate.y / (scale * fitScale);
        const originX = clamp(centerX - cropSize / 2, 0, imageNaturalSize.width - cropSize);
        const originY = clamp(centerY - cropSize / 2, 0, imageNaturalSize.height - cropSize);

        const context = ImageManipulator.manipulate(imageUri);
        context.crop({ originX, originY, width: cropSize, height: cropSize });
        const rendered = await context.renderAsync();
        const result = await rendered.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });
        return result.uri;
      },
    }),
    [imageUri, imageNaturalSize, effectiveSize, scale, fitScale, clampedTranslate.x, clampedTranslate.y]
  );

  const cx = containerSize.width / 2;
  const cy = containerSize.height / 2;
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
                left: cx - baseWidth / 2,
                top: cy - baseHeight / 2,
                width: baseWidth,
                height: baseHeight,
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
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  image: {
    position: "absolute",
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
