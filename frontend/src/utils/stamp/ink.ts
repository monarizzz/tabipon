/**
 * 工程2: 線画の暗い画素をインク色に置き換える。
 *
 * Refs: #134 / #122 / #98
 *
 * `backend/app/services/stamp_processor.py` の `create_stamp_image()` の
 * `stamp_image[dark_pixels] = ink_color` に相当する。
 *
 * 移植元（OpenCV）:
 *
 * ```python
 * dark = (img[:,:,0] < 180) & (img[:,:,1] < 180) & (img[:,:,2] < 180)
 * img[dark] = ink_color
 * ```
 *
 * ## 閾値判定は 0..1 スケール
 *
 * 暗いピクセルの判定 `< 180` は 0..255 スケール。SkSL 側は 0..1 なので
 * `180 / 255` に正規化して渡す。`<` の向きは変えていない（180 ちょうどは暗くない）。
 *
 * ## 入力は 2 値線画でなくてもよい
 *
 * 「3 チャンネルとも 180 未満なら置換」という元の条件をそのまま実装しているので、
 * 入力がグレースケールでも写真でも動く。実際に渡すのは `lineArt.ts` の
 * `generateLineArtFromImage()` の出力（0 か 255 の 2 値）なので、
 * 実質は「黒をインク色に、白は白のまま」になる。
 */
import {
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
  type SkImage,
} from "@shopify/react-native-skia";

import { STAMP_INK_COLORS, STAMP_SIZE } from "@/src/utils/stamp/constants";
import { createCachedEffect } from "@/src/utils/stamp/runtimeEffect";
import { renderToSquareImage } from "@/src/utils/stamp/surface";
import type { StampColor } from "@/src/utils/stamp/types";

/** `dark_pixels` の閾値 180 を 0..1 スケールに直したもの */
const DARK_PIXEL_THRESHOLD = 180 / 255;

/**
 * インク置換シェーダ。
 *
 * `src` は線画の画像シェーダ。判定は BGR/RGB の順に依らない（3 チャンネルとも
 * 閾値未満か）ので、元の numpy の条件をそのまま書いている。
 */
const INK_SKSL = `
uniform shader src;
uniform half4  ink;        // 0..1 に正規化したインク色（RGBA。a は常に 1）
uniform half   threshold;  // 0..1 に正規化した 180

half4 main(float2 p) {
  half4 c = src.eval(p);
  // dark_pixels = (b < 180) & (g < 180) & (r < 180)
  bool dark = c.r < threshold && c.g < threshold && c.b < threshold;
  return dark ? ink : half4(c.rgb, 1.0);
}
`;

const getInkEffect = createCachedEffect(INK_SKSL, "インク置換");

/** インク色の `SkColor` を作る（不透明）。`frame.ts` の枠線も同じ色を使う */
export function inkColorOf(color: StampColor) {
  const [r, g, b] = STAMP_INK_COLORS[color];
  return Skia.Color(`rgb(${r}, ${g}, ${b})`);
}

/** 線画の暗い画素をインク色に置き換える */
export function applyInkColor(lineArt: SkImage, color: StampColor): SkImage {
  const effect = getInkEffect();

  const [r, g, b] = STAMP_INK_COLORS[color];
  // 出力と入力が同じ 512x512 で 1:1 に対応するので、補間は掛けず元のテクセルを読む
  const source = lineArt.makeShaderOptions(
    TileMode.Clamp,
    TileMode.Clamp,
    FilterMode.Nearest,
    MipmapMode.None,
  );
  // ink を half3 ではなく half4 にしてあるのは、uniform バッファ上で
  // 3 要素ベクトルの後ろに詰め物が入る余地を作らないため（JS 側は平坦な
  // float 配列を順に流し込むだけなので、並びがずれると色が壊れる）
  const shader = effect.makeShaderWithChildren(
    [r / 255, g / 255, b / 255, 1, DARK_PIXEL_THRESHOLD],
    [source],
  );

  const paint = Skia.Paint();
  paint.setShader(shader);
  return renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawRect(Skia.XYWHRect(0, 0, STAMP_SIZE, STAMP_SIZE), paint);
  });
}
