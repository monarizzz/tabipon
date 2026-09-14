/**
 * 工程3: 円マスクで切り抜き、フレームを重ねる。
 *
 * Refs: #134 / #122 / #98
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
 *
 * ## アンチエイリアスを掛けている（OpenCV は掛けていない）
 *
 * `cv2.circle` / `cv2.ellipse` / `cv2.polylines` の既定は `lineType=LINE_8`、
 * つまりアンチエイリアス無しで、円周も波線もジャギーが出る。Skia 側でこれを
 * 再現するには `paint.setAntiAlias(false)` にすればよいが、**あえて有効のままにした**。
 *
 * - スタンプは画面上で縮小表示されるため、ジャギーは「劣化」としてそのまま見える
 * - 現行出力を忠実に再現する目的は #121 の線画（=絵の内容）であって、
 *   枠線のラスタライズ品質まで一致させる必要は無い
 *
 * 差は円周と枠線の輪郭 ±1 画素に留まり、線の太さ・半径・位置は一致する。
 */
import {
  ClipOp,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  type SkCanvas,
  type SkImage,
  type SkPaint,
} from "@shopify/react-native-skia";

import {
  FRAME_CENTER,
  FRAME_RADIUS,
  STAMP_SIZE,
} from "@/src/utils/stamp/constants";
import { inkColorOf } from "@/src/utils/stamp/ink";
import { renderToSquareImage } from "@/src/utils/stamp/surface";
import type { StampColor, StampFrame } from "@/src/utils/stamp/types";

/** `simple`: 一重円の線幅 */
const SIMPLE_THICKNESS = 3;

/** `classic`: 外周の線幅と、内側の円の線幅・半径差 */
const CLASSIC_OUTER_THICKNESS = 10;
const CLASSIC_INNER_THICKNESS = 3;
const CLASSIC_INNER_RADIUS_OFFSET = 30;

/** `dash`: 円周の分割数と線幅。奇数番だけ描くので実際の破線は 12 本 */
const DASH_COUNT = 24;
const DASH_THICKNESS = 4;

/** `wave`: 波の数・振幅・線幅と、パスに打つ点の数 */
const WAVE_COUNT = 12;
const WAVE_AMPLITUDE = 6;
const WAVE_THICKNESS = 4;
const WAVE_POINT_COUNT = 720;

/**
 * 枠線用の Paint。
 *
 * `StrokeJoin.Round` / `StrokeCap.Round` にしているのは `wave` のため。
 * 720 点の折れ線を太さ 4 で描くと、既定の Miter 継ぎでは折れ角の外側に
 * 尖りが出る。`cv2.polylines` は内部で各線分を独立した太線として描いて
 * 重ねるので尖りが出ない。丸めるのが一番近い。
 *
 * `dash` の各弧の端は `cv2.ellipse` では平らに切られる（LINE_8 の
 * 太線描画は端をキャップしない）ため、`Butt` の方が近い。呼び出し側で上書きする。
 */
function framePaint(color: StampColor, thickness: number): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(thickness);
  paint.setStrokeJoin(StrokeJoin.Round);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setColor(inkColorOf(color));
  return paint;
}

/**
 * `dash` の破線円を描く。
 *
 * `_draw_dashed_circle()` と同じく円周を 24 分割し、**奇数番の区間だけ**を描く
 * （`if i % 2 == 0: continue`）。結果として 15 度の弧が 12 本、15 度おきに並ぶ。
 *
 * 角度の起点と回転方向は OpenCV と Skia で一致している。どちらも 0 度が +x 方向で、
 * 画像座標系（y が下向き）なので画面上は時計回りに進む。
 */
function drawDashedCircle(canvas: SkCanvas, color: StampColor): void {
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

/**
 * `wave` の波形円を描く。
 *
 * `_draw_wave_circle()` の「720 点を打って閉じた折れ線にする」実装をそのまま移した。
 * 半径は `r = radius + amplitude * sin(wave_count * angle)`。
 *
 * backend は各点を `int()` で切り捨てて整数座標にしているが、ここは float のまま
 * 渡している。アンチエイリアス有りで描く以上、座標を整数に丸める意味が無いため。
 */
function drawWaveCircle(canvas: SkCanvas, color: StampColor): void {
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

/** フレーム 4 種の描き分け。`apply_circular_stamp_frame()` の分岐と対応する */
function drawFrame(
  canvas: SkCanvas,
  color: StampColor,
  frame: StampFrame,
): void {
  switch (frame) {
    case "simple":
      canvas.drawCircle(
        FRAME_CENTER,
        FRAME_CENTER,
        FRAME_RADIUS,
        framePaint(color, SIMPLE_THICKNESS),
      );
      break;
    case "classic":
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
      break;
    case "dash":
      drawDashedCircle(canvas, color);
      break;
    case "wave":
      drawWaveCircle(canvas, color);
      break;
  }
}

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
