/**
 * 枠線用の Paint。フレーム 4 種すべてがこれを使う。
 *
 * ## アンチエイリアスを掛けている（OpenCV は掛けていない）
 *
 * `cv2.circle` / `cv2.ellipse` / `cv2.polylines` の既定は `lineType=LINE_8`、
 * つまりアンチエイリアス無しで、円周も波線もジャギーが出る。再現するなら
 * `paint.setAntiAlias(false)` にすればよいが、**あえて有効のままにしてある**。
 * スタンプは画面上で縮小表示されるため、ジャギーは「劣化」としてそのまま見えるため。
 * 差は輪郭 ±1 画素に留まり、線の太さ・半径・位置は一致する。
 *
 * ## 線の継ぎ目と端
 *
 * `StrokeJoin.Round` / `StrokeCap.Round` にしているのは `wave` のため。
 * 720 点の折れ線を太さ 4 で描くと、既定の Miter 継ぎでは折れ角の外側に
 * 尖りが出る。`cv2.polylines` は内部で各線分を独立した太線として描いて
 * 重ねるので尖りが出ない。丸めるのが一番近い。
 *
 * `dash` の各弧の端は `cv2.ellipse` では平らに切られる（LINE_8 の
 * 太線描画は端をキャップしない）ため、`Butt` の方が近い。呼び出し側で上書きする。
 */
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
