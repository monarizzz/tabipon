/** 共有カードの台紙（スタンプ帳の 1 ページ）。紙・綴じ穴・罫線だけを描く。 */
import { PaintStyle, Skia, type SkCanvas } from "@shopify/react-native-skia";

import { colors } from "@/src/style/tokens";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  CONTENT_WIDTH,
  HOLE_CENTER_Y,
  HOLE_COUNT,
  HOLE_RADIUS,
  PAGE_PADDING_H,
  RULE_COUNT,
  RULE_GAP,
  RULE_TOP,
  RULE_WIDTH,
} from "@/src/utils/shareCard/constants/constants";

/** 上から `index` 本目（0 始まり）の罫線の y */
export function ruleY(index: number): number {
  return RULE_TOP + RULE_GAP * index;
}

/** 綴じ穴。紙の上端に等間隔で並べる */
function drawBindingHoles(canvas: SkCanvas): void {
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  fill.setColor(Skia.Color(colors.surface));

  const edge = Skia.Paint();
  edge.setAntiAlias(true);
  edge.setStyle(PaintStyle.Stroke);
  edge.setStrokeWidth(RULE_WIDTH);
  edge.setColor(Skia.Color(colors.border));

  // 両端の穴が紙の端に寄りすぎないよう、穴の間隔ぶんだけ内側から並べ始める
  const step = CARD_WIDTH / (HOLE_COUNT + 1);
  for (let index = 1; index <= HOLE_COUNT; index += 1) {
    const x = step * index;
    canvas.drawCircle(x, HOLE_CENTER_Y, HOLE_RADIUS, fill);
    canvas.drawCircle(x, HOLE_CENTER_Y, HOLE_RADIUS, edge);
  }
}

/**
 * 紙・綴じ穴・罫線を描く。
 *
 * **罫線は書き込む項目の数に依らず全部引く。**手書きのスタンプ帳と同じで、
 * 空いている行がそのまま残っている方が自然に見える。行の割り当ては項目ごとに
 * 決まっていて繰り上がらない（`renderShareCard()`）
 */
export function drawNotebookPage(canvas: SkCanvas): void {
  canvas.drawColor(Skia.Color(colors.bg));
  drawBindingHoles(canvas);

  const rule = Skia.Paint();
  rule.setAntiAlias(true);
  rule.setStyle(PaintStyle.Stroke);
  rule.setStrokeWidth(RULE_WIDTH);
  rule.setColor(Skia.Color(colors.border));

  for (let index = 0; index < RULE_COUNT; index += 1) {
    const y = ruleY(index);
    // 紙の下端を割るような本数を渡されても描かない
    if (y > CARD_HEIGHT) break;
    canvas.drawLine(PAGE_PADDING_H, y, PAGE_PADDING_H + CONTENT_WIDTH, y, rule);
  }
}

/** スタンプを押す位置（左上）。紙の横中央に来る */
export function stampLeft(stampSize: number): number {
  return (CARD_WIDTH - stampSize) / 2;
}
