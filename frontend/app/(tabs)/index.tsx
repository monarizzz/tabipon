import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from "expo-camera";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { CameraHintBar } from "@/src/components/features/camera/CameraHintBar/CameraHintBar";
import { CameraPreview } from "@/src/components/features/camera/CameraPreview/CameraPreview";
import { CameraControls } from "@/src/components/features/camera/CameraControls/CameraControls";
import { colors, typography, spacing } from "@/src/theme/tokens";

// プレビューは containerSize の縦横比で cover 表示されるが、takePictureAsync が返す写真は
// センサーの画角そのまま(異なる縦横比)になることがあるため、プレビューに写っていた範囲だけを
// 切り出してから次の画面へ渡す。
// 撮影画面と調整画面はどちらも「画面幅いっぱいに cover 表示 + 中央に同径のガイド円」なので、
// プレビュー範囲へ正確に切り出すことで両画面の円内の画像が一致する。
// 注意: takePictureAsync が報告する width/height は EXIF 回転適用前の値(縦持ちでも横長)に
// なる端末があり、それを信用すると切り出し位置が右上にズレて拡大されたようになる。
// そのため一度 ImageManipulator に読み込ませ、レンダリング後の ImageRef 自身の実寸で計算し、
// 同じ ImageRef に対して crop することで座標系を必ず一致させる。
async function cropToPreview(
  photo: { uri: string },
  containerSize: { width: number; height: number }
) {
  if (containerSize.width <= 0 || containerSize.height <= 0) return photo.uri;

  const source = await ImageManipulator.manipulate(photo.uri).renderAsync();
  const containerAspect = containerSize.width / containerSize.height;
  const photoAspect = source.width / source.height;

  let cropRect: { originX: number; originY: number; width: number; height: number };
  if (photoAspect > containerAspect) {
    const width = source.height * containerAspect;
    cropRect = { originX: (source.width - width) / 2, originY: 0, width, height: source.height };
  } else {
    const height = source.width / containerAspect;
    cropRect = { originX: 0, originY: (source.height - height) / 2, width: source.width, height };
  }

  const width = Math.floor(cropRect.width);
  const height = Math.floor(cropRect.height);
  const context = ImageManipulator.manipulate(source);
  context.crop({
    originX: Math.min(Math.round(cropRect.originX), source.width - width),
    originY: Math.min(Math.round(cropRect.originY), source.height - height),
    width,
    height,
  });
  const croppedImage = await context.renderAsync();
  const longestSide = Math.max(croppedImage.width, croppedImage.height);
  const imageForUpload =
    longestSide > 1600
      ? await ImageManipulator.manipulate(croppedImage)
          .resize({
            width:
              croppedImage.width >= croppedImage.height
                ? 1600
                : Math.round((croppedImage.width / croppedImage.height) * 1600),
            height:
              croppedImage.height > croppedImage.width
                ? 1600
                : Math.round((croppedImage.height / croppedImage.width) * 1600),
          })
          .renderAsync()
      : croppedImage;
  const result = await imageForUpload.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
  return result.uri;
}

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = React.useState<CameraType>("back");
  const [flash, setFlash] = React.useState<FlashMode>("off");
  const cameraRef = React.useRef<CameraView>(null);
  const containerSizeRef = React.useRef({ width: 0, height: 0 });

  const handleCapture = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    if (!photo) return;
    // 撮影時のズームは写真自体に反映済みのため、調整画面には引き継がない
    // (引き継いで再度 scale をかけるとガイド円の中身がズレる)
    const uri = await cropToPreview(photo, containerSizeRef.current);
    router.push({
      pathname: "/photo-adjust",
      params: { uri },
    });
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>カメラへのアクセスが必要です</Text>
        <CommonButton label="カメラへのアクセスを許可" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraPreview
        ref={cameraRef}
        facing={facing}
        flash={flash}
        onContainerSizeChange={(size) => {
          containerSizeRef.current = size;
        }}
      />
      <View style={[styles.hintBarWrap, { top: insets.top + spacing.m }]}>
        <CameraHintBar />
      </View>
      <View style={[styles.controlsWrap, { paddingBottom: spacing.xl }]}>
        <CameraControls
          flashOn={flash === "on"}
          onToggleFlash={() => setFlash((prev) => (prev === "on" ? "off" : "on"))}
          onCapture={handleCapture}
          onFlipCamera={() => setFacing((prev) => (prev === "back" ? "front" : "back"))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hintBarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  controlsWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
    color: colors.textPrimary,
    textAlign: "center",
  },
});
