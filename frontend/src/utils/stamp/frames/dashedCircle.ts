/**
 * `dash`: 破線円を描く。
 *
 * `_draw_dashed_circle()` と同じく円周を 24 分割し、**奇数番の区間だけ**を描く
 * （`if i % 2 == 0: continue`）。結果として 15 度の弧が 12 本、15 度おきに並ぶ。
 *
 * 角度の起点と回転方向は OpenCV と Skia で一致している。どちらも 0 度が +x 方向で、
 * 画像座標系（y が下向き）なので画面上は時計回りに進む。
 */
import { Skia, StrokeCap, type SkCanvas } from "@shopify/react-native-skia";

import {
  DASH_COUNT,
  DASH_THICKNESS,
  FRAME_CENTER,
  FRAME_RADIUS,
} from "@/src/utils/stamp/constants/constants";
import { framePaint } from "@/src/utils/stamp/framePaint";

export function drawDashedCircle(canvas: SkCanvas, color: string): void {
  const paint = framePaint(color, DASH_THICKNESS);
  // cv2.ellipse は弧の端をキャップしないので、丸めずに平らに切る
  paint.setStrokeCap(StrokeCap.Butt);

  const oval = Skia.XYWHRect(
    FRAME_CENTER - FRAME_RADIUS,
    FRAME_CENTER - FRAME_RADIUS,
    FRAME_RADIUS * 2,
    FRAME_RADIUS * 2,
  );
  const sweep = 360 / DASH_COUNT;

  for (let i = 0; i < DASH_COUNT; i += 1) {
    if (i % 2 === 0) {
      continue;
    }
    const path = Skia.Path.Make();
    path.addArc(oval, i * sweep, sweep);
    canvas.drawPath(path, paint);
  }
}
