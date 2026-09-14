/**
 * 工程5: スタンプを傾ける。
 *
 * Refs: #134 / #123 / #98
 *
 * `backend/app/services/stamp_processor.py` の `rotate_stamp()` に相当する。
 */
import {
  FilterMode,
  MipmapMode,
  Skia,
  type SkImage,
} from "@shopify/react-native-skia";

import { FRAME_CENTER, STAMP_SIZE } from "@/src/utils/stamp/constants";
import { renderToSquareImage } from "@/src/utils/stamp/surface";

/** `rotate_stamp()` が回転を掛ける下限。1 度以下は無視する */
const MIN_TILT_ANGLE = 1.0;

/**
 * スタンプを傾ける。
 *
 * backend は `getRotationMatrix2D(center, -angle_deg, 1.0)` に `warpAffine` で、
 * 余白は白（`BORDER_CONSTANT` + `(255, 255, 255)`）。
 * OpenCV の回転角は反時計回りが正なので、`-angle_deg` は「`angle_deg` だけ時計回り」。
 * Skia の `canvas.rotate()` も y 下向き座標系で時計回りが正なので、
 * **符号を反転させずにそのまま渡す**のが同じ向きになる。
 *
 * キャンバスは 512x512 のままなので、回転して外へ出た角は切り落とされる。
 * これも backend と同じ（`warpAffine` の出力サイズが `(w, h)` のため）。
 */
export function rotateStamp(stamp: SkImage, tiltAngle: number): SkImage {
  if (Math.abs(tiltAngle) <= MIN_TILT_ANGLE) {
    return stamp;
  }
  return renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawColor(Skia.Color("white"));
    canvas.rotate(tiltAngle, FRAME_CENTER, FRAME_CENTER);
    const paint = Skia.Paint();
    // 画像の外周（回転して空いた角との境目）を滑らかにする
    paint.setAntiAlias(true);
    // サンプリングは Linear。`setAntiAlias()` は輪郭にしか効かず、テクセルの補間は
    // 別物で、既定の Nearest のままだと斜めになった線や円周が階段状になる。
    // 移植元の `cv2.warpAffine` も既定は `INTER_LINEAR`
    canvas.drawImageOptions(
      stamp,
      0,
      0,
      FilterMode.Linear,
      MipmapMode.None,
      paint,
    );
  });
}
