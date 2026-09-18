/** 共有カードの台紙（スタンプ帳の 1 ページ）。紙・綴じ穴・罫線だけを描く。 */
import {
  BlendMode,
  PaintStyle,
  Skia,
  type SkCanvas,
} from "@shopify/react-native-skia";

import { colors } from "@/src/style/tokens";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  CONTENT_WIDTH,
  HOLE_CENTER_Y,
  HOLE_COUNT,
  HOLE_RADIUS,
  PAGE_PADDING_H,
  PAPER_COLOR,
  PAPER_GRAIN_ALPHA,
  PAPER_GRAIN_FREQUENCY,
  PAPER_GRAIN_OCTAVES,
  PAPER_GRAIN_SEED,
  RULE_COUNT,
  RULE_GAP,
  RULE_TOP,
  RULE_WIDTH,
} from "@/src/utils/shareCard/constants/constants";

/** 上から `index` 本目（0 始まり）の罫線の y */
export function ruleY(index: number): number {
  return RULE_TOP + RULE_GAP * index;
}

/**
 * 紙の繊維に見立てた粒状感を重ねる。
 *
 * `MakeFractalNoise` は RGB がばらばらの色付きノイズを返すので、彩度を落とす
 * カラーマトリクスを通してから薄く掛ける。`Multiply` で重ねると、明るいところだけが
 * わずかに沈んで紙の凹凸に見える。**シードは固定。**同じスタンプを共有し直したときに
 * 紙目が変わると、別の画像に見えてしまう
 */
function drawPaperGrain(canvas: SkCanvas): void {
  const paint = Skia.Paint();
  paint.setShader(
    Skia.Shader.MakeFractalNoise(
      PAPER_GRAIN_FREQUENCY,
      PAPER_GRAIN_FREQUENCY,
      PAPER_GRAIN_OCTAVES,
      PAPER_GRAIN_SEED,
      CARD_WIDTH,
      CARD_HEIGHT,
    ),
  );
  // 彩度 0 のカラーマトリクス。色を持ったノイズだと紙が色付いて見える
  paint.setColorFilter(
    Skia.ColorFilter.MakeMatrix([
      0.213, 0.715, 0.072, 0, 0, 0.213, 0.715, 0.072, 0, 0, 0.213, 0.715, 0.072,
      0, 0, 0, 0, 0, 1, 0,
    ]),
  );
  paint.setAlphaf(PAPER_GRAIN_ALPHA);
  paint.setBlendMode(BlendMode.Multiply);
  canvas.drawRect(Skia.XYWHRect(0, 0, CARD_WIDTH, CARD_HEIGHT), paint);
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
  canvas.drawColor(Skia.Color(PAPER_COLOR));
  drawPaperGrain(canvas);
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
