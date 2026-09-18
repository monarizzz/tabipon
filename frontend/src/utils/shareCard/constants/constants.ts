/**
 * 共有カードの寸法。
 *
 * 単位はすべて出力画像のピクセル。画面の dp ではないので `src/style/tokens.ts` の
 * spacing はそのまま使えない（色だけ tokens を参照する）。
 */

/** 出力サイズ。9:16（ストーリー相当の縦長） */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;

/** 紙の左右余白 */
export const PAGE_PADDING_H = 80;

/** 記入欄の幅 */
export const CONTENT_WIDTH = CARD_WIDTH - PAGE_PADDING_H * 2;

/** スタンプを押す位置と大きさ */
export const STAMP_TOP = 140;
export const STAMP_SIZE = 820;

/** 罫線の本数・間隔・太さ。1 本目はスタンプの下に置く */
export const RULE_COUNT = 5;
export const RULE_TOP = STAMP_TOP + STAMP_SIZE + 150;
export const RULE_GAP = 140;
export const RULE_WIDTH = 3;

/** 罫線と、その上に乗る文字の間隔 */
export const RULE_TO_TEXT_GAP = 14;

/** ラベルに割り当てる幅。値はこの分だけ右にずらす */
export const LABEL_WIDTH = 150;

/** 文字サイズ。`design/DESIGN.md` の階層をカードの解像度に合わせて拡大したもの */
export const SPOT_NAME_FONT_SIZE = 56;
export const LABEL_FONT_SIZE = 30;
export const VALUE_FONT_SIZE = 40;

/** メモが折り返せる行数。1 行につき罫線 1 本を使う */
export const MEMO_MAX_LINES = 2;

/** 省略記号 */
export const ELLIPSIS = "…";
