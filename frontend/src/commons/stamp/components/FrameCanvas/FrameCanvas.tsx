import {
  Canvas,
  Picture,
  createPicture,
  type SkCanvas,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { STAMP_SIZE } from "@/src/utils/stamp/constants/constants";
import { drawFrame } from "@/src/utils/stamp/frames/drawFrame";
import type { StampFrame } from "@/src/utils/stamp/types";

type Props = {
  frame: StampFrame;
  color: string;
  /** 一辺の長さ。`STAMP_SIZE` に対する縮尺として効く */
  size: number;
};

/**
 * フレームの枠を描く。本番の画像生成と同じ `drawFrame()` を縮小して使う。
 *
 * 枠を表示する箇所（サムネイル・押す画面のガイド）はここを通す。
 * 各所で RN View の円を組み直すと、寸法も枠の有無も本番とずれる（#171）。
 */
export function FrameCanvas({ frame, color, size }: Props) {
  const picture = useMemo(() => {
    const scale = size / STAMP_SIZE;
    return createPicture(
      (canvas: SkCanvas) => {
        canvas.scale(scale, scale);
        drawFrame(canvas, color, frame);
      },
      { width: size, height: size },
    );
  }, [color, frame, size]);

  return (
    <Canvas style={{ width: size, height: size }}>
      <Picture picture={picture} />
    </Canvas>
  );
}
