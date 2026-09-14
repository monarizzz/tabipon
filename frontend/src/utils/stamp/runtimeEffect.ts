/**
 * SkSL のコンパイル結果を使い回すためのヘルパー。
 *
 * ## なぜ遅延させるのか
 *
 * モジュールのトップレベルで `Skia.RuntimeEffect.Make()` を呼ぶと、Skia の
 * ネイティブモジュールが無い環境（Jest のモック）で **import しただけで落ちる**。
 *
 * ## シェーダ本体はここへ集めていない
 *
 * 分離してあるのはキャッシュ機構だけで、SkSL 文字列は各工程のファイルに残してある。
 * SkSL の `uniform` 宣言と、それを埋める JS 側の平坦な float 配列は並び順で
 * 対応しており、離すと片方だけ直したときに気付けない
 * （`ink.ts` のコメントにあるとおり、並びがずれると色が壊れる）。
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
