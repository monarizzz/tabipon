/** 円マスクで切り抜き、フレームを重ねる。 */
import { ClipOp, Skia, type SkImage } from "@shopify/react-native-skia";

import {
  FRAME_CENTER,
  FRAME_RADIUS,
  STAMP_SIZE,
} from "@/src/utils/stamp/constants/constants";
import { drawFrame } from "@/src/utils/stamp/frames/drawFrame";
import { renderToSquareImage } from "@/src/utils/stamp/surface";
import type { StampFrame } from "@/src/utils/stamp/types";

/**
 * インク色を載せた画像を円マスクで切り抜き、フレームを重ねる。
 *
 * **フレームはクリップの外で描く。**`wave` は振幅 6 の分だけ円マスクより外へはみ出すので、
 * クリップしたままだと波の山が削れてしまう。
 */
export function applyCircularFrame(
  inked: SkImage,
  color: string,
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
