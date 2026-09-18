import type { StampLocation } from "@/src/infra/db/stamps";
import type { StampFrame } from "@/src/utils/stamp/types/stampFrame";

/** `createStamp()` の引数 */
export type CreateStampInput = {
  /** 元写真の uri。この 1 枚からスタンプを描き、再生成用にそのまま保存する */
  photoUri: string;
  /**
   * 撮影した時刻の ISO 文字列。押印した時刻ではない
   * （撮影・調整・押印のあいだに日付をまたぐことがある）
   */
  capturedAt: string;
  color: string;
  frameId: StampFrame;
  /** 押した勢いから決まる演出値。長押しで押した場合はどちらも 0 */
  scratchLevel: number;
  tiltAngle: number;
  location: StampLocation | null;
  address: string | null;
};
