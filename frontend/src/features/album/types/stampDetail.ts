import type { StampFieldEditors } from "@/src/commons/stamp/types/stampField";
import type { StampDesignChange } from "@/src/features/album/types/stampDesignChange";

/** スタンプ詳細画面の状態と操作。`useStampDetail()` が返し、`<StampDetailMain />` が受け取る */
export type StampDetail = {
  /**
   * 読み込み中。`unavailable` と分けてあるのは、スピナーと「見つからない」表示の
   * どちらを出すかが変わるため。失敗したときも読み込みは終わるので false になる
   */
  loading: boolean;
  /** id が無い／DB に行が無い／読み込みに失敗した。どれも同じ表示にまとめる */
  unavailable: boolean;

  latitude: number | null;
  longitude: number | null;

  editors: StampFieldEditors;
  design: StampDesignChange;

  /** ランドマーク名を出すかのトグル。生成には渡していない見た目だけの設定 */
  showLandmarkName: boolean;
  toggleShowLandmarkName: (value: boolean) => void;

  deleteDialogVisible: boolean;
  openDeleteDialog: () => void;
  cancelDelete: () => void;
  confirmDelete: () => void;

  back: () => void;
  backToAlbum: () => void;
  share: () => void;
};
