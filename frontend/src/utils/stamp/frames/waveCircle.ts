/**
 * `wave`: 波形円を描く。
 *
 * `_draw_wave_circle()` の「720 点を打って閉じた折れ線にする」実装をそのまま移した。
 * 半径は `r = radius + amplitude * sin(wave_count * angle)`。
 *
 * backend は各点を `int()` で切り捨てて整数座標にしているが、ここは float のまま
 * 渡している。アンチエイリアス有りで描く以上、座標を整数に丸める意味が無いため。
 */
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
import type { StampColor } from "@/src/utils/stamp/types";

export function drawWaveCircle(canvas: SkCanvas, color: StampColor): void {
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

  canvas.drawPath(path, framePaint(color, WAVE_THICKNESS));
}
