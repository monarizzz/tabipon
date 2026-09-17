import { spacing } from "@/src/style/tokens";

/**
 * 完成画面の上部余白の高さを求める。
 *
 * 前の画面（押し込みアニメーション）でスタンプがあった画面座標を受け取り、
 * 遷移（`animation: "none"`）してもスタンプの見た目の位置がズレないようにする。
 * `StampShowcase` 側の上部余白の分を差し引き、リング自体の位置を合わせる。
 *
 * 位置が引き継がれていないときは `undefined` を返す。呼び出し側は余白を固定せず、
 * 全体を上下に散らす配置にする。
 *
 * @param stampTopParam ルートパラメータで受け取った y 座標（文字列）
 */
export function headerAnchorHeight(
  stampTopParam: string | undefined,
): number | undefined {
  if (stampTopParam === undefined) return undefined;
  const stampTop = Number(stampTopParam);
  if (!Number.isFinite(stampTop)) return undefined;
  // 入力欄が増えた分だけ全体を上に詰め、スクロールせずに収まるようにする
  return Math.max(0, stampTop - spacing.m - spacing.xxxl * 3);
}
