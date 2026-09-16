import React from "react";
import { View } from "react-native";
import { colors } from "@/src/style/tokens";
import type { StampFrame } from "@/src/utils/stamp/types";
import type { FrameStyleOption } from "./DesignChangeSheet";

function FrameThumb({
  variant,
  color = colors.textPlaceholder,
}: {
  variant: StampFrame;
  color?: string;
}) {
  const dot = (x: number, y: number) => (
    <View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: color,
      }}
    />
  );

  return (
    <View style={{ width: 48, height: 48 }}>
      <View
        style={{
          position: "absolute",
          left: 2,
          top: 2,
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: variant === "simple" ? 1 : 2.5,
          borderColor: color,
          borderStyle: variant === "dash" ? "dashed" : "solid",
        }}
      />
      {/* classic は二重丸 */}
      {variant === "classic" && (
        <View
          style={{
            position: "absolute",
            left: 7,
            top: 7,
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: color,
          }}
        />
      )}
      {variant === "wave" && (
        <>
          <View
            style={{
              position: "absolute",
              left: 6,
              top: 6,
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: color,
            }}
          />
          {dot(21, 0)}
          {dot(21, 43)}
          {dot(0, 21)}
          {dot(43, 21)}
        </>
      )}
    </View>
  );
}

function makePreview(variant: StampFrame) {
  // 返しているのは props ではなく selected: boolean を受け取る描画関数(render prop)。
  // React コンポーネントではないので displayName は付けられない
  // eslint-disable-next-line react/display-name
  return (selected: boolean) => (
    <FrameThumb
      variant={variant}
      color={selected ? colors.textMuted : colors.textPlaceholder}
    />
  );
}

// 表示名を持つのは label（翻訳キー）だけ。id は描画側と同じ StampFrame をそのまま使う
export const FRAME_STYLE_OPTIONS: FrameStyleOption[] = [
  {
    id: "classic",
    label: "design.frameClassic",
    preview: makePreview("classic"),
  },
  {
    id: "dash",
    label: "design.frameVintage",
    preview: makePreview("dash"),
  },
  {
    id: "simple",
    label: "design.frameMinimal",
    preview: makePreview("simple"),
  },
  { id: "wave", label: "design.frameWave", preview: makePreview("wave") },
];
