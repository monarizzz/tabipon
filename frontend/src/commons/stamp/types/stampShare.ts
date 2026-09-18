import type { Stamp } from "@/src/infra/db/stamps";

/** `useStampShare()` が返す。共有ボタンを持つ画面がそのまま受け取る */
export type StampShare = {
  /** 共有カードを作って共有シートを開く */
  share: () => void;
};

/** `useStampShare()` の引数 */
export type StampShareOptions = {
  /** 共有するスタンプ。読み込み前は null */
  stamp: Stamp | null;
  /** `console.error` に付ける画面名（`[stamp-done]` など） */
  logTag: string;
};
