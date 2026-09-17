import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { CameraControls } from "@/src/features/camera/components/CameraControls/CameraControls";
import { CameraHintBar } from "@/src/features/camera/components/CameraHintBar/CameraHintBar";
import { CameraPreview } from "@/src/features/camera/components/CameraPreview/CameraPreview";
import type { Camera } from "@/src/features/camera/types/camera";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/style/tokens";

type Props = Camera;

export function CameraMain({
  permissionGranted,
  requestPermission,
  facing,
  flash,
  capturing,
  cameraRef,
  changeContainerSize,
  capture,
  toggleFlash,
  flipCamera,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!permissionGranted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>{t("camera.accessRequiredTitle")}</Text>
        <CommonButton
          label={t("camera.accessAllow")}
          onPress={requestPermission}
        />
      </View>
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
