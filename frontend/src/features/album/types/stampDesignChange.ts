import type { Stamp } from "@/src/infra/db/stamps";
import type { StampFrame } from "@/src/utils/stamp/types/stampFrame";

export type StampDesignChange = {
  /** 画像の uri。表示にも共有にも使う。デザインを変えるとパスごと変わる */
  imageUri: string;

  designMode: boolean;
  /** 選択中デザインのプレビュー（data-URI）。生成前と変更中でない間は null */
  previewUri: string | null;
  previewLoading: boolean;
  /** 確定の処理中。二度押しはこの間だけ弾く */
  updating: boolean;

  selectedColor: string;
  selectedFrameStyleId: StampFrame;
  setSelectedColor: (color: string) => void;
  setSelectedFrameStyleId: (frameId: StampFrame) => void;

  open: () => void;
  close: () => void;
  confirm: () => void;
};

/** `useStampDesignChange()` の引数 */
export type StampDesignChangeOptions = {
  stampId: string | undefined;
  stamp: Stamp | null;
  /** 確定に成功したときに呼ぶ。画面側の `stamp` を差し替える */
  onUpdated: (stamp: Stamp) => void;
};
