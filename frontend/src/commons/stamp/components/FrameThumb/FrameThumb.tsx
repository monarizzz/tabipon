import { FrameCanvas } from "@/src/commons/stamp/components/FrameCanvas/FrameCanvas";
import { colors } from "@/src/style/tokens";
import type { StampFrame } from "@/src/utils/stamp/types";

/** サムネイルの一辺 */
const THUMB_SIZE = 48;

/**
 * 線幅の下限（実寸 px）。
 * 48px まで縮めると `simple` の 3px が約 0.28px になり、4 種の区別がつかないため。
 */
const MIN_STROKE_WIDTH = 1.2;

type Props = {
  variant: StampFrame;
  /** 選択中は濃い色で描く */
  selected?: boolean;
};

/** フレームの意匠を 48x48 で示すサムネイル。デザイン変更UIの選択肢に並べる */
export function FrameThumb({ variant, selected = false }: Props) {
  const color = selected ? colors.textMuted : colors.textPlaceholder;

  return (
    <FrameCanvas
      frame={variant}
      color={color}
      size={THUMB_SIZE}
      minStrokeWidth={MIN_STROKE_WIDTH}
    />
  );
}
