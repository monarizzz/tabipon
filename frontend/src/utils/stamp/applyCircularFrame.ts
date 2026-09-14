/**
 * 工程3: 円マスクで切り抜き、フレームを重ねる。
 *
 * `backend/app/services/stamp_processor.py` の `apply_circular_stamp_frame()` に相当する。
 *
 * 移植元（OpenCV）:
 *
 * ```python
 * radius = 512 // 2 - 8          # 248
 * center = (256, 256)
 * mask = circle(center, radius, 255, -1)
 * out = full(255); out[mask == 255] = img[mask == 255]
 * # frame ごとに circle / ellipse / polylines を重ねる
 * ```
 */
import { ClipOp, Skia, type SkImage } from "@shopify/react-native-skia";

import {
  FRAME_CENTER,
  FRAME_RADIUS,
  STAMP_SIZE,
} from "@/src/utils/stamp/constants/constants";
import { drawFrame } from "@/src/utils/stamp/frames/drawFrame";
import { renderToSquareImage } from "@/src/utils/stamp/surface";
import type { StampColor, StampFrame } from "@/src/utils/stamp/types";

/**
 * インク色を載せた画像を円マスクで切り抜き、フレームを重ねる。
 *
 * backend は「白で埋めた配列にマスク内だけ画素をコピーする」という書き方だが、
 * ここでは「白で塗る → 円でクリップ → 画像を描く → クリップを戻してフレームを描く」
 * に置き換えている。結果は同じで、円の内外の境界だけがアンチエイリアスされる。
 *
 * フレームはクリップの外で描く。`wave` は振幅 6 の分だけ円マスクより外へはみ出すので、
 * クリップしたままだと波の山が削れてしまう（backend もマスク適用後に描いている）。
 */
export function applyCircularFrame(
  inked: SkImage,
  color: StampColor,
  frame: StampFrame,
): SkImage {
  const circle = Skia.Path.Make();
  circle.addCircle(FRAME_CENTER, FRAME_CENTER, FRAME_RADIUS);

  return renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawColor(Skia.Color("white"));

    canvas.save();
    canvas.clipPath(circle, ClipOp.Intersect, true);
    canvas.drawImage(inked, 0, 0);
    canvas.restore();

    drawFrame(canvas, color, frame);
  });
}
