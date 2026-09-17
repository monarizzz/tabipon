/**
 * スタンプを傾ける。
 */
import {
  FilterMode,
  MipmapMode,
  Skia,
  type SkImage,
} from "@shopify/react-native-skia";

import {
  FRAME_CENTER,
  STAMP_SIZE,
} from "@/src/utils/stamp/constants/constants";
import { renderToSquareImage } from "@/src/utils/stamp/surface";

/** 回転を掛ける下限。1 度以下は無視する */
const MIN_TILT_ANGLE = 1.0;

/**
 * スタンプを傾ける。
 *
 * キャンバスは 512x512 のままなので、回転して外へ出た角は切り落とされる。
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
    // 別物で、既定の Nearest のままだと斜めになった線や円周が階段状になる
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
