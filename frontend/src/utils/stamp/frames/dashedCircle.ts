/** `dash`: 破線円を描く */
import { Skia, StrokeCap, type SkCanvas } from "@shopify/react-native-skia";

import {
  DASH_COUNT,
  DASH_THICKNESS,
  FRAME_CENTER,
  FRAME_RADIUS,
} from "@/src/utils/stamp/constants/constants";
import { framePaint } from "@/src/utils/stamp/framePaint";

export function drawDashedCircle(
  canvas: SkCanvas,
  color: string,
  minThickness: number,
): void {
  const paint = framePaint(color, Math.max(DASH_THICKNESS, minThickness));
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
