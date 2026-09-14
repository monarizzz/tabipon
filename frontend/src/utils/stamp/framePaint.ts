/** 枠線用の Paint。フレーム 4 種すべてがこれを使う。*/
import {
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  type SkPaint,
} from "@shopify/react-native-skia";

import { inkColorOf } from "@/src/utils/stamp/ink";

export function framePaint(color: string, thickness: number): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(thickness);
  paint.setStrokeJoin(StrokeJoin.Round);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setColor(inkColorOf(color));
  return paint;
}
