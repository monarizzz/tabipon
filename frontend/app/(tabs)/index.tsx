import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from "expo-camera";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { CameraHintBar } from "@/src/components/features/camera/CameraHintBar/CameraHintBar";
import { CameraPreview } from "@/src/components/features/camera/CameraPreview/CameraPreview";
import { CameraControls } from "@/src/components/features/camera/CameraControls/CameraControls";
import { colors, typography, spacing } from "@/src/theme/tokens";

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = React.useState<CameraType>("back");
  const [flash, setFlash] = React.useState<FlashMode>("off");
  const cameraRef = React.useRef<CameraView>(null);

  const handleCapture = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    if (!photo) return;
    router.push({ pathname: "/photo-adjust", params: { uri: photo.uri } });
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
      <CameraHintBar />
      <CameraPreview ref={cameraRef} facing={facing} flash={flash} />
      <CameraControls
        flashOn={flash === "on"}
        onToggleFlash={() => setFlash((prev) => (prev === "on" ? "off" : "on"))}
        onCapture={handleCapture}
        onFlipCamera={() => setFacing((prev) => (prev === "back" ? "front" : "back"))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "space-between",
    paddingVertical: spacing.xl,
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
