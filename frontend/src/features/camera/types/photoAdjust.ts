import type { TabBarItemData } from "@/src/commons/layout/components/TabBar/TabBar";

/** 写真調整画面の状態と操作。`usePhotoAdjust()` が返し、`<PhotoAdjustMain />` が受け取る */
export type PhotoAdjust = {
  /** 調整する写真。ルートパラメータで受け取る */
  imageUri: string | undefined;
  zoom: number;
  changeZoom: (zoom: number) => void;
  tabItems: TabBarItemData[];
  /** タブへ移ろうとして確認待ちの状態 */
  discardDialogVisible: boolean;

  back: () => void;
  /**
   * 切り出した写真を持って押印画面へ進む。
   * 切り出しは `PhotoCropArea` が持つので、結果を受け取る
   */
  confirm: (croppedUri: string | null) => Promise<void>;
  cancelDiscard: () => void;
  confirmDiscard: () => void;
};
