/**
 * 線画の暗い画素をインク色に置き換える。
 *
 * 閾値 `< 180` は 0..255 スケール。SkSL 側は 0..1 なので `180 / 255` に正規化して
 * 渡す。`<` の向きは変えない（180 ちょうどは暗くない）。
 *
 * 判定は「3 チャンネルとも閾値未満」なので入力は 2 値でなくてもよい。実際に渡すのは
 * `lineArt.ts` の `generateLineArtFromImage()` の出力（0 か 255 の 2 値）で、
 * 実質は「黒をインク色に、白は白のまま」になる。
 */
import {
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
  type SkImage,
} from "@shopify/react-native-skia";

import { STAMP_SIZE } from "@/src/utils/stamp/constants/constants";
import { createCachedEffect } from "@/src/utils/stamp/runtimeEffect";
import { renderToSquareImage } from "@/src/utils/stamp/surface";

/** 暗い画素と判定する閾値 180（0..255 スケール）を 0..1 に直したもの */
const DARK_PIXEL_THRESHOLD = 180 / 255;

/**
 * インク置換シェーダ。
 *
 * `src` は線画の画像シェーダ。判定は「3 チャンネルとも閾値未満か」なので、
 * チャンネルの並び（BGR / RGB）に依らない。
 */
const INK_SKSL = `
uniform shader src;
uniform half4  ink;        // 0..1 に正規化したインク色（RGBA。a は常に 1）
uniform half   threshold;  // 0..1 に正規化した 180

half4 main(float2 p) {
  half4 c = src.eval(p);
  bool dark = c.r < threshold && c.g < threshold && c.b < threshold;
  return dark ? ink : half4(c.rgb, 1.0);
}
`;

const getInkEffect = createCachedEffect(INK_SKSL, "インク置換");

/** インク色の `SkColor` を作る（不透明）。`frames/` の枠線も同じ色を使う */
export function inkColorOf(color: string) {
  return Skia.Color(color);
}

/** 線画の暗い画素をインク色に置き換える */
export function applyInkColor(lineArt: SkImage, color: string): SkImage {
  const effect = getInkEffect();

  // 出力と入力が同じ 512x512 で 1:1 に対応するので、補間は掛けず元のテクセルを読む
  const source = lineArt.makeShaderOptions(
    TileMode.Clamp,
    TileMode.Clamp,
    FilterMode.Nearest,
    MipmapMode.None,
  );
  // ink を half3 ではなく half4 にしてあるのは、uniform バッファ上で
  // 3 要素ベクトルの後ろに詰め物が入る余地を作らないため（JS 側は平坦な
  // float 配列を順に流し込むだけなので、並びがずれると色が壊れる）。
  // `SkColor` は 0..1 に正規化された RGBA の Float32Array なので、half4 へそのまま流せる
  const shader = effect.makeShaderWithChildren(
    [...inkColorOf(color), DARK_PIXEL_THRESHOLD],
    [source],
  );

  const paint = Skia.Paint();
  paint.setShader(shader);
  return renderToSquareImage(STAMP_SIZE, (canvas) => {
    canvas.drawRect(Skia.XYWHRect(0, 0, STAMP_SIZE, STAMP_SIZE), paint);
  });
}
