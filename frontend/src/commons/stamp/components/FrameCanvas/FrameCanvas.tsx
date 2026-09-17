import {
  Canvas,
  Picture,
  createPicture,
  type SkCanvas,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { STAMP_SIZE } from "@/src/utils/stamp/constants/constants";
import { drawFrame } from "@/src/utils/stamp/frames/drawFrame";
import type { StampFrame } from "@/src/utils/stamp/types/stampFrame";

type Props = {
  frame: StampFrame;
  color: string;
  /** 一辺の長さ。`STAMP_SIZE` に対する縮尺として効く */
  size: number;
  /**
   * 線幅の下限。画面上の実寸（px）で指定する。
   * 縮尺で割った値を `drawFrame()` に渡すため、縮小しても指定した太さを下回らない。
   * 省略時は下限なしで、線幅も縮尺どおりに細くなる。
   */
  minStrokeWidth?: number;
};

/**
 * フレームの枠を描く。本番の画像生成と同じ `drawFrame()` を縮小して使う。
 *
 * 枠を表示する箇所（サムネイル・押す画面のガイド）はここを通す。
 * 各所で RN View の円を組み直すと、寸法も枠の有無も本番とずれる。
 */
export function FrameCanvas({ frame, color, size, minStrokeWidth }: Props) {
  const picture = useMemo(() => {
    const scale = size / STAMP_SIZE;
    // 下限は実寸で決まるが描画は 512px 空間なので、縮尺で割って戻してから渡す
    const minThickness =
      minStrokeWidth === undefined ? undefined : minStrokeWidth / scale;
    return createPicture(
      (canvas: SkCanvas) => {
        canvas.scale(scale, scale);
        drawFrame(canvas, color, frame, minThickness);
      },
      { width: size, height: size },
    );
  }, [color, frame, minStrokeWidth, size]);

  return (
    <Canvas style={{ width: size, height: size }}>
      <Picture picture={picture} />
    </Canvas>
  );
}
