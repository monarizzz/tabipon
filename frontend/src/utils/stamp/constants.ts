/**
 * スタンプ生成で共有する寸法と色。
 *
 * Refs: #134 / #122 / #98
 *
 * **ここには `Skia.*` を呼ぶ値を置かない。**モジュールのトップレベルで
 * `Skia.*` を評価すると、ネイティブモジュールが無い環境（Jest のモック）で
 * import しただけで落ちる。素の数値だけに留め、`SkColor` などへの変換は
 * 呼ばれた時点で各工程が行う。
 */
import type { StampColor } from "@/src/utils/stamp/types";

/**
 * 生成する画像の一辺。backend の `STAMP_IMAGE_SIZE` と揃える。
 *
 * 線画も仕上げも同じ 512x512 で、全工程が同寸のオフスクリーンを連ねる前提に
 * なっている（工程間でリサイズしない）。
 */
export const STAMP_SIZE = 512;

/**
 * 線画のサイズ。`STAMP_SIZE` と同値だが、線画化は仕上げと独立した工程なので
 * 名前を分けてある（`lineArt.ts` は仕上げ側の定数を参照しない）。
 */
export const LINE_ART_SIZE = STAMP_SIZE;

/** RGB の 3 要素（各 0..255）。`Skia.Color` に渡す前の素の値 */
export type InkRgb = readonly [number, number, number];

/**
 * インク色 4 色。`stamp_processor.py` の `STAMP_COLORS` と同じ色を **RGB 順**で持つ。
 *
 * | 色 | backend (BGR) | ここ (RGB) |
 * | --- | --- | --- |
 * | red | `[30, 50, 220]` | `[220, 50, 30]` |
 * | blue | `[180, 60, 30]` | `[30, 60, 180]` |
 * | black | `[30, 30, 30]` | `[30, 30, 30]` |
 * | green | `[100, 130, 40]` | `[40, 130, 100]` |
 *
 * ## 色順が BGR → RGBA
 *
 * `STAMP_COLORS` の numpy 配列は **BGR 順**（OpenCV の既定）。
 * 例えば red の `[30, 50, 220]` は B=30 / G=50 / R=220 で、赤が 220。
 * Skia は RGBA なので、ここでは反転させた値を書いている。
 * 素直に読み替えると赤と青が入れ替わるので、最初に間違えやすい箇所。
 * black は BGR/RGB で同値なので、この表だけ見ると変換したように見えない。
 */
export const STAMP_INK_COLORS: Record<StampColor, InkRgb> = {
  red: [220, 50, 30],
  blue: [30, 60, 180],
  black: [30, 30, 30],
  green: [40, 130, 100],
};

/** 円マスク・フレームの半径。`STAMP_IMAGE_SIZE // 2 - 8` と同じ */
export const FRAME_RADIUS = Math.floor(STAMP_SIZE / 2) - 8;

/** 円の中心。`(STAMP_IMAGE_SIZE // 2, STAMP_IMAGE_SIZE // 2)` と同じ */
export const FRAME_CENTER = Math.floor(STAMP_SIZE / 2);
