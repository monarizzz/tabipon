/** `classic`: 太い外周と細い内円の二重円を描く */
import { type SkCanvas } from "@shopify/react-native-skia";

import {
  CLASSIC_INNER_RADIUS_OFFSET,
  CLASSIC_INNER_THICKNESS,
  CLASSIC_OUTER_THICKNESS,
  FRAME_CENTER,
  FRAME_RADIUS,
} from "@/src/utils/stamp/constants/constants";
import { framePaint } from "@/src/utils/stamp/framePaint";
import type { StampColor } from "@/src/utils/stamp/types";

export function drawClassicCircle(canvas: SkCanvas, color: StampColor): void {
  canvas.drawCircle(
    FRAME_CENTER,
    FRAME_CENTER,
    FRAME_RADIUS,
    framePaint(color, CLASSIC_OUTER_THICKNESS),
  );
  canvas.drawCircle(
    FRAME_CENTER,
    FRAME_CENTER,
    FRAME_RADIUS - CLASSIC_INNER_RADIUS_OFFSET,
    framePaint(color, CLASSIC_INNER_THICKNESS),
  );
}
