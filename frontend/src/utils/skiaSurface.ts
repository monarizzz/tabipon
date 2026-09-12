/**
 * Skia のオフスクリーン描画ヘルパー。
 *
 * Refs: #122 / #98
 *
 * `src/utils/skiaLineArt.ts` に閉じていた private ヘルパーを、
 * `src/utils/skiaStamp.ts` からも同じ条件で使うために切り出したもの。
 * 「同じサイズのサーフェスを作って描いてスナップショットを返す」以上のことはしない。
 *
 * ## `Skia.Surface.MakeOffscreen` は GPU バックエンド
 *
 * 型定義のコメントどおり GPU バックエンドのサーフェスを作る（CPU が要るときは
 * `Skia.Surface.Make`）。そのため `makeImageSnapshot()` の結果は、呼んだスレッドの
 * Skia コンテキストに属するテクスチャになる。同一スレッド内で中間結果として使う分には
 * 問題ないが、`<Canvas>`（UI スレッド）へ渡す最終結果は `makeNonTextureImage()` で
 * ラスタ画像に落とす必要がある。詳細は `skiaLineArt.ts` の
 * `generateLineArtFromImage()` のコメントを参照。
 */
import { Skia, type SkCanvas, type SkImage } from "@shopify/react-native-skia";

/** 正方形のオフスクリーンサーフェスに描いてスナップショットを返す */
export function renderToSquareImage(
  size: number,
  draw: (canvas: SkCanvas) => void,
): SkImage {
  const surface = Skia.Surface.MakeOffscreen(size, size);
  if (!surface) {
    throw new Error("Skia.Surface.MakeOffscreen に失敗した");
  }
  draw(surface.getCanvas());
  surface.flush();
  return surface.makeImageSnapshot();
}
