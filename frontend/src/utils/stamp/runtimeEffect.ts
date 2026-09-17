/**
 * SkSL のコンパイル結果を使い回すためのヘルパー。
 *
 * モジュールのトップレベルで `Skia.RuntimeEffect.Make()` を呼ぶと、Skia の
 * ネイティブモジュールが無い環境（Jest のモック）で **import しただけで落ちる**。
 * そのためコンパイルは初回の呼び出しまで遅らせる。
 *
 * ここに置いたのはキャッシュ機構だけで、SkSL 文字列は各工程のファイルに残す
 * （`docs/stamp-pipeline.md`「ルール」）。
 */
import { Skia, type SkRuntimeEffect } from "@shopify/react-native-skia";

/**
 * SkSL を初回呼び出し時にコンパイルし、以降は同じ `SkRuntimeEffect` を返す関数を作る。
 *
 * コンパイルに失敗した場合も結果（`null`）を憶えるので、描画のたびに
 * 失敗するシェーダを組み直すことはない。
 *
 * @param source SkSL のソース
 * @param label 失敗時のメッセージに入れるシェーダ名（「インク置換」など）
 */
export function createCachedEffect(
  source: string,
  label: string,
): () => SkRuntimeEffect {
  // null = コンパイル失敗、undefined = まだ試していない
  let cached: SkRuntimeEffect | null | undefined;

  return () => {
    if (cached === undefined) {
      cached = Skia.RuntimeEffect.Make(source) ?? null;
    }
    if (!cached) {
      throw new Error(`${label}シェーダ (SkSL) のコンパイルに失敗した`);
    }
    return cached;
  };
}
