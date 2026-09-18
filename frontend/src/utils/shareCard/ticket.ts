/** 共有カードのチケット型の台紙（外形・枠線・切り取り線）。 */
import {
  PaintStyle,
  PathOp,
  Skia,
  StrokeCap,
  type SkCanvas,
} from "@shopify/react-native-skia";

import { colors } from "@/src/style/tokens";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  MAT_MARGIN,
  NOTCH_RADIUS,
  STUB_HEIGHT,
  TEAR_DASH,
  TEAR_LINE_WIDTH,
  TICKET_BORDER_WIDTH,
  TICKET_PADDING_H,
  TICKET_RADIUS,
} from "@/src/utils/shareCard/constants/constants";

/** チケットの座標。本券・半券の中身はこの値を基準に置く */
export type TicketGeometry = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** 切り取り線の y。ここより上が本券、下が半券 */
  tearY: number;
  /** 内側余白を除いた文字の左端と幅 */
  contentLeft: number;
  contentWidth: number;
};

export function ticketGeometry(): TicketGeometry {
  const left = MAT_MARGIN;
  const right = CARD_WIDTH - MAT_MARGIN;
  const bottom = CARD_HEIGHT - MAT_MARGIN;

  return {
    left,
    right,
    top: MAT_MARGIN,
    bottom,
    tearY: bottom - STUB_HEIGHT,
    contentLeft: left + TICKET_PADDING_H,
    contentWidth: right - left - TICKET_PADDING_H * 2,
  };
}

/**
 * チケットの外形を 1 本のパスにする。
 *
 * **半円は円を重ねるのではなくパスから引く。**台紙色で塗った円を後から重ねると、
 * チケットの内側にも円の枠線が出てしまう。角丸長方形から円を差し引いておけば、
 * 切り欠きの縁もチケットの枠線として 1 度に描ける
 */
function ticketOutline(geometry: TicketGeometry) {
  const { left, right, top, bottom, tearY } = geometry;

  const body = Skia.Path.Make();
  body.addRRect(
    Skia.RRectXY(
      Skia.XYWHRect(left, top, right - left, bottom - top),
      TICKET_RADIUS,
      TICKET_RADIUS,
    ),
  );

  const notches = Skia.Path.Make();
  notches.addCircle(left, tearY, NOTCH_RADIUS);
  notches.addCircle(right, tearY, NOTCH_RADIUS);

  const outline = Skia.Path.MakeFromOp(body, notches, PathOp.Difference);
  if (!outline) {
    throw new Error("チケット外形のパス演算に失敗した");
  }
  return outline;
}

/** 台紙・チケット・切り取り線を描く。中身はこのあとに重ねる */
export function drawTicket(canvas: SkCanvas, geometry: TicketGeometry): void {
  canvas.drawColor(Skia.Color(colors.surface));

  const outline = ticketOutline(geometry);

  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  fill.setColor(Skia.Color(colors.bg));
  canvas.drawPath(outline, fill);

  const border = Skia.Paint();
  border.setAntiAlias(true);
  border.setStyle(PaintStyle.Stroke);
  border.setStrokeWidth(TICKET_BORDER_WIDTH);
  border.setColor(Skia.Color(colors.border));
  canvas.drawPath(outline, border);

  const tear = Skia.Paint();
  tear.setAntiAlias(true);
  tear.setStyle(PaintStyle.Stroke);
  tear.setStrokeWidth(TEAR_LINE_WIDTH);
  tear.setStrokeCap(StrokeCap.Round);
  tear.setColor(Skia.Color(colors.border));
  tear.setPathEffect(Skia.PathEffect.MakeDash([...TEAR_DASH]));
  canvas.drawLine(
    geometry.left + NOTCH_RADIUS,
    geometry.tearY,
    geometry.right - NOTCH_RADIUS,
    geometry.tearY,
    tear,
  );
}
