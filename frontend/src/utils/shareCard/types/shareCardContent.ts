import type { SkImage } from "@shopify/react-native-skia";

/** 罫線 1 本に書き込む 1 項目 */
export type ShareCardField = {
  /** 行の左に小さく出す項目名（「日付」など） */
  label: string;
  /** 書き込む値。空文字の項目は呼び出し側で除く */
  value: string;
  /** 折り返せる行数。2 以上なら罫線もその本数を使う。省略すると 1 */
  maxLines?: number;
};

/**
 * 共有カードに載せる中身。
 *
 * **文言は持たない。**項目名は `label` として受け取る。`src/utils/` は i18n を
 * 知らないため（`docs/front-architecture.md`「文言」）。
 *
 * **アプリ名とハッシュタグは載せない。**投稿に付ける文字列は共有シートの本文が持つ
 * （`docs/share-card.md`）
 */
export type ShareCardContent = {
  /** 仕上げ済みのスタンプ画像 */
  stamp: SkImage;
  /** スポット名。1 本目の罫線にラベル無しで大きく書く。未入力なら空文字 */
  spotName: string;
  /** スポット名の下に上から順に書き込む項目。値の無いものは含めない */
  fields: ShareCardField[];
};
