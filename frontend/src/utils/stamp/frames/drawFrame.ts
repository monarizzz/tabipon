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

/**
 * @param minThickness 線幅の下限。この 512px 空間での値で、各フレームは
 *   自分の線幅とこの値の大きい方を使う。縮小して表示する側が、縮尺で割った値を
 *   渡すことで「画面上の実寸」の下限として効かせる（`FrameCanvas`）。
 *   本番の画像生成（512px 等倍）は既定の 0 のまま、下限なしで描く。
 */
export function drawFrame(
  canvas: SkCanvas,
  color: string,
  frame: StampFrame,
  minThickness = 0,
): void {
  switch (frame) {
    case "simple":
      drawSimpleCircle(canvas, color, minThickness);
      break;
    case "classic":
      drawClassicCircle(canvas, color, minThickness);
      break;
    case "dash":
      drawDashedCircle(canvas, color, minThickness);
      break;
    case "wave":
      drawWaveCircle(canvas, color, minThickness);
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
