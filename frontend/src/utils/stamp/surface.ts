/**
 * Skia のオフスクリーン描画ヘルパー。
 *
 * Refs: #134 / #122 / #98
 *
 * もとは `src/utils/skiaSurface.ts`。#134 で `src/utils/stamp/` に集約した。
 * 「同じサイズのサーフェスを作って描いてスナップショットを返す」以上のことはしない。
 *
 * ## `Skia.Surface.MakeOffscreen` は GPU バックエンド
 *
 * 型定義のコメントどおり GPU バックエンドのサーフェスを作る（CPU が要るときは
 * `Skia.Surface.Make`）。そのため `makeImageSnapshot()` の結果は、呼んだスレッドの
 * Skia コンテキストに属するテクスチャになる。同一スレッド内で中間結果として使う分には
 * 問題ないが、`<Canvas>`（UI スレッド）へ渡す最終結果は `toRasterImage()` で
 * ラスタ画像に落とす必要がある。
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

/**
 * GPU テクスチャを CPU メモリ上のラスタ画像へ落とす。
 *
 * Refs: #121 / #123
 *
 * `renderToSquareImage()` が返す `SkImage` は、生成したスレッドの Skia
 * コンテキストに属する GPU テクスチャ。この関数群は JS スレッドから呼ばれるが、
 * `<Canvas>` の描画は UI スレッドの Skia コンテキストで行われる。
 * 公式ドキュメント（Canvas overview）は `makeImageSnapshotAsync` を「UI スレッドで
 * 実行されるので、テクスチャを含めオンスクリーンの Canvas と同じ Skia コンテキストに
 * アクセスできる」と説明し、同期版の `makeImageSnapshot` は「描画にテクスチャを
 * 含まない場合に使ってよい」としている。つまり **コンテキストが違えばテクスチャは
 * 共有されない**。別コンテキストのテクスチャを描こうとしても例外は飛ばず、
 * 単に何も出ない。
 *
 * `makeNonTextureImage()` は「GPU テクスチャに backed された SkImage を必要なら
 * CPU メモリへコピーする」API なので、これを通した結果はどのコンテキスト・
 * どのスレッドからでも描ける素のラスタ画像になる。読み戻し自体は生成した
 * コンテキスト内で行われるので安全（`readPixels` が同じ経路で動いていることが
 * 実機で確認できている）。
 *
 * **工程の途中では呼ばない。**中間パスは同一スレッド・同一コンテキスト内でしか
 * 使わないので、テクスチャのまま渡した方が読み戻しのコストが掛からない。
 * 呼ぶのは呼び出し側へ返す直前だけ。
 *
 * @param label 失敗時のメッセージに入れる対象名（「線画画像」など）
 */
export function toRasterImage(image: SkImage, label: string): SkImage {
  const raster = image.makeNonTextureImage();
  if (!raster) {
    throw new Error(`${label}の CPU コピーへの変換に失敗した`);
  }
  return raster;
}
