/**
 * フレーム 4 種の描き分け。`apply_circular_stamp_frame()` の分岐と対応する。
 *
 * **ここは振り分けだけを持つ。**描き方はフレームごとのファイルにある。
 * フレームを増やすときは `StampFrame`（`types.ts`）に値を足し、
 * 同じ階層にファイルを 1 つ作ってここに case を足す。
 */
import { type SkCanvas } from "@shopify/react-native-skia";

import { drawClassicCircle } from "@/src/utils/stamp/frame/classicCircle";
import { drawDashedCircle } from "@/src/utils/stamp/frame/dashedCircle";
import { drawSimpleCircle } from "@/src/utils/stamp/frame/simpleCircle";
import { drawWaveCircle } from "@/src/utils/stamp/frame/waveCircle";
import type { StampColor, StampFrame } from "@/src/utils/stamp/types";

export function drawFrame(
  canvas: SkCanvas,
  color: StampColor,
  frame: StampFrame,
): void {
  switch (frame) {
    case "simple":
      drawSimpleCircle(canvas, color);
      break;
    case "classic":
      drawClassicCircle(canvas, color);
      break;
    case "dash":
      drawDashedCircle(canvas, color);
      break;
    case "wave":
      drawWaveCircle(canvas, color);
      break;
  }
}
