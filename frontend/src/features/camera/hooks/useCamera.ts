import React from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { openSettings } from "expo-linking";
import {
  useCameraPermissions,
  type CameraType,
  type CameraView,
  type FlashMode,
} from "expo-camera";

import type { Camera } from "@/src/features/camera/types/camera";
import { cropToPreview } from "@/src/features/camera/utils/cropToPreview";

/** カメラ画面の状態と操作をまとめて持つ */
export function useCamera(): Camera {
  const router = useRouter();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
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

  // 撮影後に戻ってきたときは、また撮れる状態にしておく
  useFocusEffect(stopCapturing);

  const permissionGranted = permission?.granted ?? false;

  // 設定アプリで権限を変えてから戻ってきたときに反映する。
  // useCameraPermissions() が自動で読むのはマウント時の 1 度だけで、
  // 画面が残ったままだと古い拒否状態を表示し続ける
  useFocusEffect(
    React.useCallback(() => {
      if (permissionGranted) return;
      void getPermission();
    }, [permissionGranted, getPermission]),
  );

  return {
    permissionGranted,
    // 読み込み中 (permission === null) は拒否済みと決めつけず、
    // アプリ内で許可を求められる側に倒す
    permissionCanAskAgain: permission?.canAskAgain ?? true,
    requestPermission,
    openSettings: () => {
      void openSettings();
    },

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
          stopCapturing();
          return;
        }
        // 撮影時のズームは写真自体に反映済みのため、調整画面には引き継がない
        // (引き継いで再度 scale をかけるとガイド円の中身がズレる)
        const uri = await cropToPreview(photo, containerSizeRef.current);
        router.push({ pathname: "/photo-adjust", params: { uri } });
      } catch {
        stopCapturing();
      }
    },
    toggleFlash: () => setFlash((prev) => (prev === "on" ? "off" : "on")),
    flipCamera: () => setFacing((prev) => (prev === "back" ? "front" : "back")),
  };
}
