/**
 * フレーム 4 種の描き分け。`apply_circular_stamp_frame()` の分岐と対応する。
 *
 * **ここは振り分けだけを持つ。**描き方はフレームごとのファイルにある。
 * フレームを増やすときは `StampFrame`（`types.ts`）に値を足し、
 * 同じ階層にファイルを 1 つ作ってここに case を足す。
 * case を足し忘れると `default` の `never` 代入が型エラーになる。
 */
import { type SkCanvas } from "@shopify/react-native-skia";

import { drawClassicCircle } from "@/src/utils/stamp/frames/classicCircle";
import { drawDashedCircle } from "@/src/utils/stamp/frames/dashedCircle";
import { drawSimpleCircle } from "@/src/utils/stamp/frames/simpleCircle";
import { drawWaveCircle } from "@/src/utils/stamp/frames/waveCircle";
import type { StampFrame } from "@/src/utils/stamp/types";

export function drawFrame(
  canvas: SkCanvas,
  color: string,
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
    // 枠だけ描かれないスタンプが黙って出来上がるより、止めて気付ける方を採る。
    // DB からの読み出しは `isStampFrame()` で型どおりの値へ寄せているので、
    // ここに来るのは case の足し忘れか、型を迂回して渡した場合だけ
    default: {
      const unknownFrame: never = frame;
      throw new Error(`未知のフレーム: ${String(unknownFrame)}`);
    }
  }
}
