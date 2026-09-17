/** `wave`: 波形円を描く。 */
import { Skia, type SkCanvas } from "@shopify/react-native-skia";

import {
  FRAME_CENTER,
  FRAME_RADIUS,
  WAVE_AMPLITUDE,
  WAVE_COUNT,
  WAVE_POINT_COUNT,
  WAVE_THICKNESS,
} from "@/src/utils/stamp/constants/constants";
import { framePaint } from "@/src/utils/stamp/framePaint";

export function drawWaveCircle(
  canvas: SkCanvas,
  color: string,
  minThickness: number,
): void {
  const path = Skia.Path.Make();
  for (let i = 0; i < WAVE_POINT_COUNT; i += 1) {
    const angle = (2 * Math.PI * i) / WAVE_POINT_COUNT;
    const radius = FRAME_RADIUS + WAVE_AMPLITUDE * Math.sin(WAVE_COUNT * angle);
    const x = FRAME_CENTER + radius * Math.cos(angle);
    const y = FRAME_CENTER + radius * Math.sin(angle);
    if (i === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }
  // cv2.polylines(..., isClosed=True) と同じく最後の点と最初の点を繋ぐ
  path.close();

  canvas.drawPath(
    path,
    framePaint(color, Math.max(WAVE_THICKNESS, minThickness)),
  );
}
