import type { TabBarItemData } from "@/src/commons/layout/components/TabBar/TabBar";
import type { PressGestureFinish } from "@/src/utils/stampPress/pressGesture";
import type { StampFrame } from "@/src/utils/stamp/types/stampFrame";

/** 押印画面の状態と操作。`useStampPress()` が返し、`<StampPressMain />` が受け取る */
export type StampPress = {
  /** 押すスタンプの元になる写真。ルートパラメータで受け取る */
  imageUri: string | undefined;
  tabItems: TabBarItemData[];

  /** 確定済みのデザイン。スタンプを押したときに生成へ渡すのはこちら */
  color: string;
  frameStyleId: StampFrame;
  /**
   * シートで選択中のデザイン。**確定と分けてある。**
   * シートはスワイプや背景タップでも閉じられるので、選択をそのまま確定扱いにすると
   * 「適用」を押さずに閉じたつもりでも生成に使われてしまう
   */
  draftColor: string;
  draftFrameStyleId: StampFrame;
  selectDraftColor: (color: string) => void;
  selectDraftFrameStyle: (frameId: StampFrame) => void;

  designSheetVisible: boolean;
  openDesignSheet: () => void;
  closeDesignSheet: () => void;
  confirmDesign: () => void;

  showLandmarkName: boolean;
  toggleShowLandmarkName: (value: boolean) => void;

  helpVisible: boolean;
  toggleHelp: () => void;
  closeHelp: () => void;

  /** 生成と保存の待ち。全面のオーバーレイを出す */
  waiting: boolean;
  saveFailed: boolean;
  saveErrorMessage: string;
  dismissSaveFailed: () => void;
  /** 失敗したあとの再試行。押した位置は前回のものを使い回す */
  retrySave: () => void;

  /** タブへ移ろうとして確認待ちの状態 */
  discardDialogVisible: boolean;
  cancelDiscard: () => void;
  confirmDiscard: () => void;

  back: () => void;
  /**
   * スタンプを押し終えたときに呼ぶ。
   * 押した瞬間に決まる演出値と、次の画面へ引き継ぐ画面座標を渡す
   */
  createStamp: (finish: PressGestureFinish, stampTop: number) => void;
};
