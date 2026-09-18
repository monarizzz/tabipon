import type React from "react";
import type { CameraType, CameraView, FlashMode } from "expo-camera";

/** カメラ画面の状態と操作。`useCamera()` が返し、`<CameraMain />` が受け取る */
export type Camera = {
  /** 権限がまだ無い間は許可を求める表示にする */
  permissionGranted: boolean;
  /**
   * アプリから権限ダイアログをもう一度出せるか。
   * 一度拒否されると OS はダイアログを出さなくなり、
   * `requestPermission()` は何も表示せずに拒否のまま返る
   */
  permissionCanAskAgain: boolean;
  requestPermission: () => void;
  /** 権限を戻せるのが OS の設定アプリだけになったときの逃げ道 */
  openSettings: () => void;

  facing: CameraType;
  flash: FlashMode;
  /** 撮影中。二度押しを弾いている間はシャッターを無効にする */
  capturing: boolean;

  /**
   * 撮影と、撮れた写真の表示領域はどちらもプレビューが持つので、
   * 実体への参照をこちらから渡す
   */
  cameraRef: React.RefObject<CameraView | null>;
  changeContainerSize: (size: { width: number; height: number }) => void;

  capture: () => Promise<void>;
  toggleFlash: () => void;
  flipCamera: () => void;
};
