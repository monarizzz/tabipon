/** `simple`: 一重円を描く */
import { type SkCanvas } from "@shopify/react-native-skia";

import {
  FRAME_CENTER,
  FRAME_RADIUS,
  SIMPLE_THICKNESS,
} from "@/src/utils/stamp/constants/constants";
import { framePaint } from "@/src/utils/stamp/framePaint";

export function drawSimpleCircle(canvas: SkCanvas, color: string): void {
  canvas.drawCircle(
    FRAME_CENTER,
    FRAME_CENTER,
    FRAME_RADIUS,
    framePaint(color, SIMPLE_THICKNESS),
  );
}
