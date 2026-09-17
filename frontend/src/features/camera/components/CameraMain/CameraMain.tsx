import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CameraControls } from "@/src/features/camera/components/CameraControls/CameraControls";
import { CameraHintBar } from "@/src/features/camera/components/CameraHintBar/CameraHintBar";
import { CameraPermissionNotice } from "@/src/features/camera/components/CameraPermissionNotice/CameraPermissionNotice";
import { CameraPreview } from "@/src/features/camera/components/CameraPreview/CameraPreview";
import type { Camera } from "@/src/features/camera/types/camera";
import { colors, spacing } from "@/src/style/tokens";

type Props = Camera;

export function CameraMain({
  permissionGranted,
  permissionCanAskAgain,
  requestPermission,
  openSettings,
  facing,
  flash,
  capturing,
  cameraRef,
  changeContainerSize,
  capture,
  toggleFlash,
  flipCamera,
}: Props) {
  const insets = useSafeAreaInsets();

  if (!permissionGranted) {
    return (
      <CameraPermissionNotice
        canAskAgain={permissionCanAskAgain}
        onRequestPermission={requestPermission}
        onOpenSettings={openSettings}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CameraPreview
        ref={cameraRef}
        facing={facing}
        flash={flash}
        onContainerSizeChange={changeContainerSize}
      />
      <View style={[styles.hintBarWrap, { top: insets.top + spacing.m }]}>
        <CameraHintBar />
      </View>
      <View style={[styles.controlsWrap, { paddingBottom: spacing.xl }]}>
        <CameraControls
          flashOn={flash === "on"}
          onToggleFlash={toggleFlash}
          onCapture={capture}
          disabled={capturing}
          onFlipCamera={flipCamera}
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
});
