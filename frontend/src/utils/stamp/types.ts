/**
 * スタンプ描画の定義域。
 *
 * Refs: #134 / #98
 *
 * もとは `src/api/stamps.ts` が持っていたが、あれは backend への転送層であって
 * 型の持ち主ではなかった。#98 で backend を廃止した際にファイルごと消えたので、
 * **実際に値域を決めている側**（描画）へ移してある。
 *
 * 追加・削除するとフレーム描画（`frame.ts`）とインク色表（`constants.ts`）の
 * `Record` が網羅性で落ちるため、片方だけ増やすことはできない。
 */

/** インク色。`constants.ts` の `STAMP_INK_COLORS` と 1:1 で対応する */
export type StampColor = "red" | "blue" | "black" | "green";

/** 円フレームの種類。`frame.ts` の `drawFrame()` の分岐と 1:1 で対応する */
export type StampFrame = "simple" | "classic" | "dash" | "wave";
