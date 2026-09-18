/**
 * 共有カードの寸法。
 *
 * 単位はすべて出力画像のピクセル。画面の dp ではないので `src/style/tokens.ts` の
 * spacing はそのまま使えない（色だけ tokens を参照する）。
 */

/** 出力サイズ。9:16（ストーリー相当の縦長） */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;

/**
 * チケットの外側に残す台紙の余白。
 *
 * 0 なので台紙は切り取り線の切り欠きからしか見えない。チケットは断ち切りで、
 * 角丸も付けない
 */
export const MAT_MARGIN = 0;

/** チケットの角丸と枠線 */
export const TICKET_RADIUS = 0;
export const TICKET_BORDER_WIDTH = 3;

/** 半券（切り取り線より下）の高さ */
export const STUB_HEIGHT = 300;

/** 切り取り線の両端に食い込ませる半円の半径 */
export const NOTCH_RADIUS = 34;

/** 切り取り線の破線。`[線, 空白]` の長さ */
export const TEAR_DASH: readonly number[] = [18, 14];
export const TEAR_LINE_WIDTH = 3;

/** チケット内側の左右余白 */
export const TICKET_PADDING_H = 40;

/** 本券に置くスタンプ画像の一辺。左右の余白を除いた幅いっぱい */
export const STAMP_SIZE = CARD_WIDTH - TICKET_PADDING_H * 2;

/** スタンプとスポット名の間隔 */
export const STAMP_TO_SPOT_NAME_GAP = 48;

/** 半券の上余白と行間 */
export const STUB_PADDING_TOP = 72;
export const STUB_LINE_GAP = 20;

/** 文字サイズ。`design/DESIGN.md` の階層をカードの解像度に合わせて拡大したもの */
export const SPOT_NAME_FONT_SIZE = 64;
export const DATE_FONT_SIZE = 44;
export const ADDRESS_FONT_SIZE = 34;

/** スポット名の最大行数。超える分は省略記号に畳む */
export const SPOT_NAME_MAX_LINES = 2;

/** 省略記号 */
export const ELLIPSIS = "…";
