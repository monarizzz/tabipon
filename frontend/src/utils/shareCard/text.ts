/**
 * 共有カードのテキスト描画。
 *
 * **`SkFont` + `drawText()` ではなく Paragraph を使う。**`drawText()` は渡した
 * typeface 1 つだけで描くので、日本語を含む文字列を欧文の typeface で描くと
 * 字形が無い文字が豆腐になる。Paragraph は端末のフォントマネージャを通して
 * 字形の無い文字を別のフォントへ回すため、日本語がそのまま出る。
 * 折り返し・省略記号・行数の上限も Paragraph 側が持っている。
 */
import {
  FontWeight,
  Skia,
  TextAlign,
  type SkCanvas,
  type SkParagraph,
} from "@shopify/react-native-skia";

import { ELLIPSIS } from "@/src/utils/shareCard/constants/constants";

export type TextBlock = {
  text: string;
  fontSize: number;
  color: string;
  weight?: FontWeight;
  align?: TextAlign;
  /** 省略記号に畳むまでの行数。省略すると 1 行 */
  maxLines?: number;
};

function buildParagraph(block: TextBlock, width: number): SkParagraph {
  const builder = Skia.ParagraphBuilder.Make({
    textAlign: block.align ?? TextAlign.Left,
    maxLines: block.maxLines ?? 1,
    ellipsis: ELLIPSIS,
  });
  builder.pushStyle({
    color: Skia.Color(block.color),
    fontSize: block.fontSize,
    fontStyle: { weight: block.weight ?? FontWeight.Normal },
  });
  builder.addText(block.text);
  const paragraph = builder.build();
  paragraph.layout(width);
  return paragraph;
}

/** 幅 `width` に収めて描いたときの高さ。描かずに位置を決めたいときに使う */
export function measureTextHeight(block: TextBlock, width: number): number {
  return buildParagraph(block, width).getHeight();
}

/**
 * `(x, y)` を左上として幅 `width` の範囲に描く。戻り値は描いた高さ。
 *
 * 次の行の y は戻り値を足して決める。行間は呼び出し側が持つ
 */
export function drawTextBlock(
  canvas: SkCanvas,
  block: TextBlock,
  x: number,
  y: number,
  width: number,
): number {
  const paragraph = buildParagraph(block, width);
  paragraph.paint(canvas, x, y);
  return paragraph.getHeight();
}
