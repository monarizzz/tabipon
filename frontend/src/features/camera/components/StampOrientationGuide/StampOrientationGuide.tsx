import React from "react";
import { View } from "react-native";
import { FrameCanvas } from "@/src/commons/stamp/components/FrameCanvas/FrameCanvas";
import type { StampFrame } from "@/src/utils/stamp/types";

type Props = {
  size?: number;
  color: string;
  frameId: StampFrame;
};

export function StampOrientationGuide({ size = 260, color, frameId }: Props) {
  // 向きを示す矢印（上向き三角 + 縦線）
  const arrowW = 14;
  const arrowH = 20;
  const lineH = 28;
  const arrowTop = size / 2 - arrowH - lineH;
  const lineTop = size / 2 - lineH;

  return (
    <View style={{ width: size, height: size }}>
      {/* 枠は本番の画像生成と同じ描画を縮小して使う */}
      <FrameCanvas frame={frameId} color={color} size={size} />

      {/* 向きガイド：上向き三角 */}
      <View
        style={{
          position: "absolute",
          top: arrowTop,
          left: size / 2 - arrowW / 2,
          width: 0,
          height: 0,
          borderLeftWidth: arrowW / 2,
          borderRightWidth: arrowW / 2,
          borderBottomWidth: arrowH,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
          opacity: 0.75,
        }}
      />
      {/* 向きガイド：縦線 */}
      <View
        style={{
          position: "absolute",
          top: lineTop,
          left: size / 2 - 1,
          width: 2,
          height: lineH,
          backgroundColor: color,
          opacity: 0.75,
        }}
      />
    </View>
  );
}
