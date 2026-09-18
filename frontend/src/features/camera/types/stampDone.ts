import type { TabBarItemData } from "@/src/commons/layout/components/TabBar/TabBar";
import type { StampFieldEditors } from "@/src/commons/stamp/types/stampField";

/** スタンプ完成画面の状態と操作。`useStampDone()` が返し、`<StampDoneMain />` が受け取る */
export type StampDone = {
  /** 表示するスタンプ画像。読み込み前は undefined */
  imageUri: string | undefined;
  editors: StampFieldEditors;
  tabItems: TabBarItemData[];
  /**
   * 上部余白の高さ。押した位置を引き継げなかったときは undefined で、
   * 呼び出し側は全体を上下に散らす配置にする
   */
  headerAnchorHeight: number | undefined;
  /** 撮り直しの確認を出しているか */
  retakeDialogVisible: boolean;
  /** 下部に出す知らせ。`<Toast message={...} />` へ渡す。出していない間は null */
  toastMessage: string | null;

  share: () => void;
  openRetakeDialog: () => void;
  cancelRetake: () => void;
  confirmRetake: () => void;
  continueShooting: () => void;
  goToAlbum: () => void;
};
