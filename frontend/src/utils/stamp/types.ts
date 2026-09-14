/**
 * 追加・削除するとフレーム描画（`frame.ts`）とインク色表（`constants.ts`）の
 * `Record` が網羅性で落ちるため、片方だけ増やすことはできない。
 */

/** インク色 */
export type StampColor = "red" | "blue" | "black" | "green";

/** 円フレームの種類 */
export type StampFrame = "simple" | "classic" | "dash" | "wave";

/** RGB の 3 要素（各 0..255）。`Skia.Color` に渡す前の素の値 */
export type InkRgb = readonly [number, number, number];
