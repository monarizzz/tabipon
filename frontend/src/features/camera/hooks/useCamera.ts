import React from "react";
import { Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  useCameraPermissions,
  type CameraType,
  type CameraView,
  type FlashMode,
} from "expo-camera";

import type { Camera } from "@/src/features/camera/types/camera";
import { cropToPreview } from "@/src/features/camera/utils/cropToPreview";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";

/** カメラ画面の状態と操作をまとめて持つ */
export function useCamera(): Camera {
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = React.useState<CameraType>("back");
  const [flash, setFlash] = React.useState<FlashMode>("off");
  const cameraRef = React.useRef<CameraView>(null);
  const containerSizeRef = React.useRef({ width: 0, height: 0 });
  // 表示に使う capturing と別に ref も持つ。setState は次のレンダーまで反映されず、
  // 連打されると同じフレームのうちに 2 回目が通ってしまう
  const capturingRef = React.useRef(false);
  const [capturing, setCapturing] = React.useState(false);

  const stopCapturing = React.useCallback(() => {
    capturingRef.current = false;
    setCapturing(false);
  }, []);

  const failCapture = React.useCallback(
    (reason: unknown) => {
      console.error("[camera] failed to capture", reason);
      stopCapturing();
      Alert.alert(
        t("camera.captureFailedTitle"),
        t("camera.captureFailedMessage"),
      );
    },
    [stopCapturing, t],
  );

  // 撮影後に戻ってきたときは、また撮れる状態にしておく
  useFocusEffect(stopCapturing);

  return {
    permissionGranted: permission?.granted ?? false,
    requestPermission,

    facing,
    flash,
    capturing,

    cameraRef,
    changeContainerSize: (size) => {
      containerSizeRef.current = size;
    },

    capture: async () => {
      if (capturingRef.current) return;
      capturingRef.current = true;
      setCapturing(true);
      try {
        const photo = await cameraRef.current?.takePictureAsync();
        if (!photo) {
          // takePictureAsync() は失敗を例外ではなく undefined で返すことがある。
          // 利用者から見ると例外時と同じ「何も起きない」なので同じ扱いにする
          failCapture(new Error("takePictureAsync returned no photo"));
          return;
        }
        // 撮影時のズームは写真自体に反映済みのため、調整画面には引き継がない
        // (引き継いで再度 scale をかけるとガイド円の中身がズレる)
        const uri = await cropToPreview(photo, containerSizeRef.current);
        router.push({ pathname: "/photo-adjust", params: { uri } });
      } catch (error) {
        failCapture(error);
      }
    },
    toggleFlash: () => setFlash((prev) => (prev === "on" ? "off" : "on")),
    flipCamera: () => setFacing((prev) => (prev === "back" ? "front" : "back")),
  };
}
