/**
 * 共有カード 1 枚を組み立てる。
 *
 * 置き方は上から順ではなく、本券（切り取り線より上）と半券（下）で別々に決める。
 * 本券はスタンプとスポット名をひとまとまりにして縦中央へ、半券は日付と場所を置く。
 */
import {
  FontWeight,
  Skia,
  TextAlign,
  type SkCanvas,
  type SkImage,
} from "@shopify/react-native-skia";

import { colors } from "@/src/style/tokens";
import {
  ADDRESS_FONT_SIZE,
  CARD_HEIGHT,
  CARD_WIDTH,
  DATE_FONT_SIZE,
  SPOT_NAME_FONT_SIZE,
  SPOT_NAME_MAX_LINES,
  STAMP_SIZE,
  STAMP_TO_SPOT_NAME_GAP,
  STUB_LINE_GAP,
  STUB_PADDING_TOP,
} from "@/src/utils/shareCard/constants/constants";
import {
  drawTextBlock,
  measureTextHeight,
  type TextBlock,
} from "@/src/utils/shareCard/text";
import { drawTicket, ticketGeometry } from "@/src/utils/shareCard/ticket";
import type { ShareCardContent } from "@/src/utils/shareCard/types/shareCardContent";
import { renderToImage, toRasterImage } from "@/src/utils/skia/surface";

function spotNameBlock(spotName: string): TextBlock {
  return {
    text: spotName,
    fontSize: SPOT_NAME_FONT_SIZE,
    color: colors.textPrimary,
    weight: FontWeight.Bold,
    align: TextAlign.Center,
    maxLines: SPOT_NAME_MAX_LINES,
  };
}

/** 本券。スタンプとスポット名をひとまとまりにして縦中央へ置く */
function drawTicketBody(
  canvas: SkCanvas,
  stamp: SkImage,
  spotName: string,
  top: number,
  tearY: number,
  contentLeft: number,
  contentWidth: number,
): void {
  const block = spotName ? spotNameBlock(spotName) : null;
  const spotNameHeight = block ? measureTextHeight(block, contentWidth) : 0;
  // スポット名が無ければ間隔ごと詰める
  const totalHeight =
    STAMP_SIZE + (block ? STAMP_TO_SPOT_NAME_GAP + spotNameHeight : 0);
  const stampTop = top + (tearY - top - totalHeight) / 2;

  canvas.drawImageRect(
    stamp,
    Skia.XYWHRect(0, 0, stamp.width(), stamp.height()),
    Skia.XYWHRect(
      (CARD_WIDTH - STAMP_SIZE) / 2,
      stampTop,
      STAMP_SIZE,
      STAMP_SIZE,
    ),
    Skia.Paint(),
  );

  if (block) {
    drawTextBlock(
      canvas,
      block,
      contentLeft,
      stampTop + STAMP_SIZE + STAMP_TO_SPOT_NAME_GAP,
      contentWidth,
    );
  }
}

/** 半券。日付と場所を上から積む */
function drawTicketStub(
  canvas: SkCanvas,
  content: ShareCardContent,
  tearY: number,
  contentLeft: number,
  contentWidth: number,
): void {
  let y = tearY + STUB_PADDING_TOP;

  // 値の無い項目は行ごと詰める。間隔も一緒に飛ばす
  for (const block of [
    content.date
      ? {
          text: content.date,
          fontSize: DATE_FONT_SIZE,
          color: colors.textPrimary,
          align: TextAlign.Center,
        }
      : null,
    content.address
      ? {
          text: content.address,
          fontSize: ADDRESS_FONT_SIZE,
          color: colors.textMuted,
          align: TextAlign.Center,
        }
      : null,
  ]) {
    if (!block) continue;
    y += drawTextBlock(canvas, block, contentLeft, y, contentWidth);
    y += STUB_LINE_GAP;
  }
}

/** 共有カードを描く */
export function renderShareCard(content: ShareCardContent): SkImage {
  const geometry = ticketGeometry();

  const card = renderToImage(CARD_WIDTH, CARD_HEIGHT, (canvas) => {
    drawTicket(canvas, geometry);
    drawTicketBody(
      canvas,
      content.stamp,
      content.spotName,
      geometry.top,
      geometry.tearY,
      geometry.contentLeft,
      geometry.contentWidth,
    );
    drawTicketStub(
      canvas,
      content,
      geometry.tearY,
      geometry.contentLeft,
      geometry.contentWidth,
    );
  });

  return toRasterImage(card, "共有カード");
}
