import { useRef, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { colors, typography } from "@/src/theme/tokens";

type Props = {
  imageUri?: string;
  size?: number;
  zoom?: number;
  onChangeZoom?: (value: number) => void;
};

const HANDLE_SIZE = 14;
const PINCH_SENSITIVITY = 1;
const SCALE_MIN = 1;
const SCALE_MAX = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PhotoCropArea({ imageUri, size = 296, zoom = 0, onChangeZoom }: Props) {
  const scale = SCALE_MIN + zoom * (SCALE_MAX - SCALE_MIN);
  const maxOffset = (size * (scale - 1)) / 2;

  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const baseZoom = useRef(zoom);
  const baseTranslate = useRef(translate);

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
        x: clamp(baseTranslate.current.x + event.translationX, -maxOffset, maxOffset),
        y: clamp(baseTranslate.current.y + event.translationY, -maxOffset, maxOffset),
      });
    });

  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  const clampedTranslate = {
    x: clamp(translate.x, -maxOffset, maxOffset),
    y: clamp(translate.y, -maxOffset, maxOffset),
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dimTop} />
      <View style={styles.dimBottom} />
      <View style={styles.row}>
        <View style={styles.dimSide} />
        <View
          style={[
            styles.circle,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          {imageUri ? (
            <GestureDetector gesture={combinedGesture}>
              <Image
                source={{ uri: imageUri }}
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
            <Text style={styles.placeholder}>[ 撮影した写真 ]</Text>
          )}
        </View>
        <View style={styles.dimSide} />
      </View>
      {(["N", "S", "E", "W"] as const).map((position) => (
        <View
          key={position}
          style={[styles.handle, handlePosition(position, size)]}
        />
      ))}
    </View>
  );
}

function handlePosition(position: "N" | "S" | "E" | "W", size: number) {
  const half = HANDLE_SIZE / 2;
  const radius = size / 2;
  switch (position) {
    case "N":
      return { top: radius - half, left: "50%" as const, marginLeft: -half };
    case "S":
      return { bottom: radius - half, left: "50%" as const, marginLeft: -half };
    case "E":
      return { right: radius - half, top: "50%" as const, marginTop: -half };
    case "W":
      return { left: radius - half, top: "50%" as const, marginTop: -half };
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  dimTop: {
    height: 85,
    backgroundColor: "rgba(0,0,0,0.19)",
  },
  dimBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: "rgba(0,0,0,0.19)",
  },
  dimSide: {
    flex: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(0,0,0,0.19)",
  },
  circle: {
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    fontSize: typography.buttonLabel.fontSize,
    color: colors.textPlaceholder,
    textAlign: "center",
    width: 160,
  },
  handle: {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
