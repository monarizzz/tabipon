/**
 * 共有カード 1 枚を組み立てる。
 *
 * スタンプ帳の 1 ページに見立て、上にスタンプを押し、その下の罫線へ手書きの記入欄の
 * ように項目を書き込む。書き込む順は「スポット名 → 渡された項目」で、値の無い項目は
 * 呼び出し側が除いてあるので後ろの項目が繰り上がる。
 */
import {
  FontWeight,
  Skia,
  type SkCanvas,
  type SkImage,
} from "@shopify/react-native-skia";

import { colors } from "@/src/style/tokens";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  CONTENT_WIDTH,
  LABEL_FONT_SIZE,
  LABEL_WIDTH,
  PAGE_PADDING_H,
  RULE_GAP,
  RULE_TO_TEXT_GAP,
  SPOT_NAME_FONT_SIZE,
  STAMP_SIZE,
  STAMP_TOP,
  VALUE_FONT_SIZE,
} from "@/src/utils/shareCard/constants/constants";
import {
  drawNotebookPage,
  ruleY,
  stampLeft,
} from "@/src/utils/shareCard/notebook";
import {
  drawTextBlock,
  measureTextHeight,
  type TextBlock,
} from "@/src/utils/shareCard/text";
import type {
  ShareCardContent,
  ShareCardField,
} from "@/src/utils/shareCard/types/shareCardContent";
import { renderToImage, toRasterImage } from "@/src/utils/skia/surface";

/**
 * 罫線の上に文字を乗せる。
 *
 * Paragraph は左上を指定して描くので、罫線の y から文字の高さを引いて上端を出す。
 * 折り返した行も罫線に乗るよう、行高は罫線の間隔に合わせてある
 */
function drawOnRule(
  canvas: SkCanvas,
  block: TextBlock,
  left: number,
  width: number,
  bottom: number,
): void {
  const height = measureTextHeight(block, width);
  drawTextBlock(canvas, block, left, bottom - height, width);
}

/** スポット名。1 本目の罫線にラベル無しで大きく書く */
function drawSpotName(canvas: SkCanvas, spotName: string, index: number): void {
  drawOnRule(
    canvas,
    {
      text: spotName,
      fontSize: SPOT_NAME_FONT_SIZE,
      color: colors.textPrimary,
      weight: FontWeight.Bold,
    },
    PAGE_PADDING_H,
    CONTENT_WIDTH,
    ruleY(index) - RULE_TO_TEXT_GAP,
  );
}

/** ラベル付きの 1 項目。ラベルは行の左に小さく、値はその右に書く */
function drawField(
  canvas: SkCanvas,
  field: ShareCardField,
  index: number,
): void {
  const bottom = ruleY(index) - RULE_TO_TEXT_GAP;

  drawOnRule(
    canvas,
    {
      text: field.label,
      fontSize: LABEL_FONT_SIZE,
      color: colors.textMuted,
    },
    PAGE_PADDING_H,
    LABEL_WIDTH,
    bottom,
  );

  const maxLines = field.maxLines ?? 1;
  drawOnRule(
    canvas,
    {
      text: field.value,
      fontSize: VALUE_FONT_SIZE,
      color: colors.textPrimary,
      maxLines,
      // 折り返した行を次の罫線に乗せる
      lineHeight: maxLines > 1 ? RULE_GAP : undefined,
    },
    PAGE_PADDING_H + LABEL_WIDTH,
    CONTENT_WIDTH - LABEL_WIDTH,
    // 複数行は下の罫線まで使うので、最後の行の位置へ下げる
    bottom + RULE_GAP * (maxLines - 1),
  );
}

/** 共有カードを描く */
export function renderShareCard(content: ShareCardContent): SkImage {
  const card = renderToImage(CARD_WIDTH, CARD_HEIGHT, (canvas) => {
    drawNotebookPage(canvas);

    canvas.drawImageRect(
      content.stamp,
      Skia.XYWHRect(0, 0, content.stamp.width(), content.stamp.height()),
      Skia.XYWHRect(stampLeft(STAMP_SIZE), STAMP_TOP, STAMP_SIZE, STAMP_SIZE),
      Skia.Paint(),
    );

    // 使った罫線の本数を数えながら上から書き込む。複数行の項目はその分だけ進める
    let index = 0;
    if (content.spotName) {
      drawSpotName(canvas, content.spotName, index);
      index += 1;
    }
    for (const field of content.fields) {
      drawField(canvas, field, index);
      index += field.maxLines ?? 1;
    }
  });

  return toRasterImage(card, "共有カード");
}
