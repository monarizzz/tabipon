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
export const PAGE_PADDING_H = 72;

/** 記入欄の幅 */
export const CONTENT_WIDTH = CARD_WIDTH - PAGE_PADDING_H * 2;

/** 上端の綴じ穴。リングノートの見え方に寄せる */
export const HOLE_COUNT = 7;
export const HOLE_RADIUS = 26;
export const HOLE_CENTER_Y = 96;

/**
 * スタンプを押す位置と大きさ。記入欄と同じ幅にして左右を揃える。
 *
 * 記入欄は 1 項目 1 行に抑えてあり、余った高さはすべてスタンプに回している
 */
export const STAMP_TOP = 220;
export const STAMP_SIZE = CONTENT_WIDTH;

/**
 * 罫線の本数・間隔・太さ。
 *
 * 本数はスポット名 + 日付 + 場所 + メモ の 4 行ぶん。どの項目も 1 行に収め、
 * 入り切らない分は省略記号に畳む
 */
export const RULE_COUNT = 4;
export const RULE_TOP = 1400;
export const RULE_GAP = 130;
export const RULE_WIDTH = 3;

/** 罫線と、その上に乗る文字の間隔 */
export const RULE_TO_TEXT_GAP = 14;

/** ラベルに割り当てる幅。値はこの分だけ右にずらす */
export const LABEL_WIDTH = 150;

/** 文字サイズ。`design/DESIGN.md` の階層をカードの解像度に合わせて拡大したもの */
export const SPOT_NAME_FONT_SIZE = 56;
export const LABEL_FONT_SIZE = 30;
export const VALUE_FONT_SIZE = 40;

/** 省略記号 */
export const ELLIPSIS = "…";
