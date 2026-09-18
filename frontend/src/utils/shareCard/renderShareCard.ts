/**
 * 共有カード 1 枚を組み立てる。
 *
 * スタンプ帳の 1 ページに見立て、上にスタンプを押し、その下の罫線へ手書きの記入欄の
 * ように項目を書き込む。
 */
import {
  FilterMode,
  FontWeight,
  MipmapMode,
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
 * Paragraph は左上を指定して描くので、罫線の y から文字の高さを引いて上端を出す
 */
function drawOnRule(
  canvas: SkCanvas,
  block: TextBlock,
  left: number,
  width: number,
  ruleIndex: number,
): void {
  const bottom = ruleY(ruleIndex) - RULE_TO_TEXT_GAP;
  const height = measureTextHeight(block, width);
  drawTextBlock(canvas, block, left, bottom - height, width);
}

/** スポット名。1 本目の罫線にラベル無しで大きく書く */
function drawSpotName(canvas: SkCanvas, spotName: string): void {
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
    0,
  );
}

/** ラベル付きの 1 項目。ラベルは行の左に小さく、値はその右に書く */
function drawField(
  canvas: SkCanvas,
  field: ShareCardField,
  ruleIndex: number,
): void {
  drawOnRule(
    canvas,
    {
      text: field.label,
      fontSize: LABEL_FONT_SIZE,
      color: colors.textMuted,
    },
    PAGE_PADDING_H,
    LABEL_WIDTH,
    ruleIndex,
  );

  drawOnRule(
    canvas,
    {
      text: field.value,
      fontSize: VALUE_FONT_SIZE,
      color: colors.textPrimary,
    },
    PAGE_PADDING_H + LABEL_WIDTH,
    CONTENT_WIDTH - LABEL_WIDTH,
    ruleIndex,
  );
}

/** 共有カードを描く */
export function renderShareCard(content: ShareCardContent): SkImage {
  const card = renderToImage(CARD_WIDTH, CARD_HEIGHT, (canvas) => {
    drawNotebookPage(canvas);

    // 保存済みのスタンプは 512x512。カード上ではその倍近くまで引き伸ばすので、
    // サンプリングに Linear を指定する。既定の Nearest のままだと、枠の円周や
    // 斜めの線が階段状になる（`src/utils/stamp/rotate.ts` と同じ理由）
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    canvas.drawImageRectOptions(
      content.stamp,
      Skia.XYWHRect(0, 0, content.stamp.width(), content.stamp.height()),
      Skia.XYWHRect(stampLeft(STAMP_SIZE), STAMP_TOP, STAMP_SIZE, STAMP_SIZE),
      FilterMode.Linear,
      MipmapMode.None,
      paint,
    );

    // **値が無くても行は詰めない。**項目ごとに使う罫線を決め打ちにする。
    // 繰り上げると、スポット名の無いスタンプだけ下の項目が 1 行上にずれて、
    // 同じ項目が別の高さに出てしまう
    if (content.spotName) {
      drawSpotName(canvas, content.spotName);
    }
    content.fields.forEach((field, index) => {
      if (!field.value) return;
      drawField(canvas, field, index + 1);
    });
  });

  return toRasterImage(card, "共有カード");
}
