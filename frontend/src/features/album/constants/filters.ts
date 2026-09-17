// フィルターの id は固定。ラベルは描画時に翻訳・整形する。
// tokyo/kyoto/walk はデモ用のコレクション名（ユーザーデータ相当）なので翻訳対象外。
export const FILTER_IDS: { id: string; label?: string }[] = [
  { id: "all" },
  { id: "tokyo", label: "東京旅行" },
  { id: "kyoto", label: "京都" },
  { id: "walk", label: "散歩" },
];
