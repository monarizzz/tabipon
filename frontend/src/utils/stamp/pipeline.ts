/**
 * 工程の順序を決める層。
 *
 * **このファイルは工程を並べるだけで、描画そのものは持たない。**
 * 個々の工程は `lineArt.ts` / `ink.ts` / `frame.ts` / `scratch.ts` / `rotate.ts` にある。
 * 順序を変える検討（#138）で触るのはここ 1 箇所になるよう分けてある。
 *
 * 現在の順序は backend の `process_stamp_image()` と同じで、
 * **線画化 → 着色 → フレーム → 掠れ → 傾き**。
 * 掠れをフレームより後に掛けるので、枠線にも掠れが乗る（backend もそうなっている）。
 */
import type { SkImage } from "@shopify/react-native-skia";

import { applyCircularFrame } from "@/src/utils/stamp/applyCircularFrame";
import { applyInkColor } from "@/src/utils/stamp/ink";
import { generateLineArtFromImage } from "@/src/utils/stamp/lineArt";
import { rotateStamp } from "@/src/utils/stamp/rotate";
import { applyScratch } from "@/src/utils/stamp/scratch";
import { toRasterImage } from "@/src/utils/stamp/surface";
import type { StampFrame } from "@/src/utils/stamp/types";

/** スタンプ 1 枚を描くためのパラメータ。backend の `process_stamp_image()` の引数と対応する */
export type StampRenderOptions = {
  color: string;
  frame: StampFrame;
  /** 0..1。押し付けの弱さから決まる（`app/stamp-press.tsx` の DeviceMotion） */
  scratchLevel?: number;
  /** 度。時計回りが正 */
  tiltAngle?: number;
  /**
   * 掠れ模様のシード。同じ値なら必ず同じ模様になる。
   * 省略時は 0（＝常に同じ模様）で、呼び出し側が決めるのが前提。
   * スタンプの id から作るなら `seed.ts` の `seedFromStampId()` を使う。
   */
  seed?: number;
};

/**
 * 線画からスタンプ 1 枚を仕上げる。着色 → フレーム → 掠れ → 傾きの順。
 *
 * 線画を作り直さずに色やフレームだけ変えたいとき（デザイン変更）はこちらを呼ぶ。
 */
export function renderStampFromLineArt(
  lineArt: SkImage,
  options: StampRenderOptions,
): SkImage {
  const { color, frame, scratchLevel = 0, tiltAngle = 0, seed = 0 } = options;
  const inked = applyInkColor(lineArt, color);
  const framed = applyCircularFrame(inked, color, frame);
  const scratched = applyScratch(framed, scratchLevel, seed);
  const rotated = rotateStamp(scratched, tiltAngle);
  // GPU テクスチャのままでは呼び出し側の <Canvas> で描けない
  return toRasterImage(rotated, "スタンプ画像");
}

/**
 * 線画からスタンプ画像（インク色 + フレーム）だけを作る。掠れと傾きは掛けない。
 *
 * 掠れ・傾きの入力（DeviceMotion）がまだ無い段階でのプレビュー用。
 */
export function composeStampFromLineArt(
  lineArt: SkImage,
  color: string,
  frame: StampFrame,
): SkImage {
  const inked = applyInkColor(lineArt, color);
  return toRasterImage(applyCircularFrame(inked, color, frame), "スタンプ画像");
}

/**
 * 写真からスタンプ画像を生成する。線画化から仕上げまでの全工程で、
 * `process_stamp_image()` の全体に相当する。
 */
export function generateStampFromImage(
  image: SkImage,
  options: StampRenderOptions,
): SkImage {
  return renderStampFromLineArt(generateLineArtFromImage(image), options);
}
