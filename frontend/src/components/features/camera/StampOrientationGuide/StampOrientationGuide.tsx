import React from "react";
import { View } from "react-native";

type FrameId = "classic" | "vintage" | "minimal" | "wave";

type Props = {
  size?: number;
  color: string;
  frameId: FrameId;
};

export function StampOrientationGuide({ size = 260, color, frameId }: Props) {
  const pad = 8;
  const outerSize = size - pad * 2;
  const outerRadius = outerSize / 2;
  const outerBorderWidth = frameId === "minimal" ? 2 : 8;
  const innerInset = 30;
  const innerSize = outerSize - innerInset * 2;
  const innerRadius = innerSize / 2;
  const showInnerRing = frameId === "classic" || frameId === "vintage";

  // ウェーブフレームの4方向ドット位置
  const waveDots =
    frameId === "wave"
      ? [
          { top: pad - 4, left: size / 2 - 4 },
          { bottom: pad - 4, left: size / 2 - 4 },
          { top: size / 2 - 4, left: pad - 4 },
          { top: size / 2 - 4, right: pad - 4 },
        ]
      : [];

  // 向きを示す矢印（上向き三角 + 縦線）
  const arrowW = 14;
  const arrowH = 20;
  const lineH = 28;
  const arrowTop = size / 2 - arrowH - lineH;
  const lineTop = size / 2 - lineH;

  return (
    <View style={{ width: size, height: size }}>
      {/* 外枠 */}
      <View
        style={{
          position: "absolute",
          top: pad,
          left: pad,
          width: outerSize,
          height: outerSize,
          borderRadius: outerRadius,
          borderWidth: outerBorderWidth,
          borderColor: color,
          borderStyle: frameId === "vintage" ? "dashed" : "solid",
        }}
      />

      {/* 内枠（classic / vintage） */}
      {showInnerRing && (
        <View
          style={{
            position: "absolute",
            top: pad + innerInset,
            left: pad + innerInset,
            width: innerSize,
            height: innerSize,
            borderRadius: innerRadius,
            borderWidth: 2,
            borderColor: color,
          }}
        />
      )}

      {/* wave ドット */}
      {waveDots.map((style, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            ...style,
          }}
        />
      ))}

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
