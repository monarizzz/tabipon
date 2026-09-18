import type { SkImage } from "@shopify/react-native-skia";

/**
 * 共有カードに載せる中身。
 *
 * 文字列の項目は空文字を「無し」として扱い、その行ごと詰める
 * （`renderShareCard()`）。呼び出し側で「未設定」の表示文言に置き換えないこと。
 *
 * **アプリ名とハッシュタグは載せない。**投稿に付ける文字列は共有時に
 * クリップボードへ入れる本文が持つ（`docs/share-card.md`）
 */
export type ShareCardContent = {
  /** 仕上げ済みのスタンプ画像 */
  stamp: SkImage;
  /** スポット名。未入力なら空文字 */
  spotName: string;
  /** `YYYY/MM/DD` に整形済みの撮影日。解釈できない値だったら空文字 */
  date: string;
  /** 場所（住所）の 1 行。未設定なら空文字 */
  address: string;
};
