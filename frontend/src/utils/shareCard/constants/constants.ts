/**
 * 共有カードの寸法。
 *
 * 単位はすべて出力画像のピクセル。画面の dp ではないので `src/style/tokens.ts` の
 * spacing はそのまま使えない（色だけ tokens を参照する）。
 */

/** 出力サイズ。4:5（X のタイムラインで切られにくい縦長） */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

/** チケットの外側に残す台紙の余白 */
export const MAT_MARGIN = 48;

/** チケットの角丸と枠線 */
export const TICKET_RADIUS = 36;
export const TICKET_BORDER_WIDTH = 3;

/** 半券（切り取り線より下）の高さ */
export const STUB_HEIGHT = 330;

/** 切り取り線の両端に食い込ませる半円の半径 */
export const NOTCH_RADIUS = 34;

/** 切り取り線の破線。`[線, 空白]` の長さ */
export const TEAR_DASH: readonly number[] = [18, 14];
export const TEAR_LINE_WIDTH = 3;

/** チケット内側の左右余白 */
export const TICKET_PADDING_H = 72;

/** 本券に置くスタンプ画像の一辺 */
export const STAMP_SIZE = 620;

/** スタンプとスポット名の間隔 */
export const STAMP_TO_SPOT_NAME_GAP = 40;

/** 半券の上下余白と行間 */
export const STUB_PADDING_TOP = 52;
export const STUB_PADDING_BOTTOM = 44;
export const STUB_LINE_GAP = 14;

/** 文字サイズ。`design/DESIGN.md` の階層をカードの解像度に合わせて拡大したもの */
export const SPOT_NAME_FONT_SIZE = 52;
export const DATE_FONT_SIZE = 38;
export const ADDRESS_FONT_SIZE = 30;
export const BRAND_FONT_SIZE = 32;

/** スポット名の最大行数。超える分は省略記号に畳む */
export const SPOT_NAME_MAX_LINES = 2;

/** 省略記号 */
export const ELLIPSIS = "…";
