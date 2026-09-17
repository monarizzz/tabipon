import { View } from "react-native";
import { FrameDot } from "@/src/commons/stamp/components/FrameDot/FrameDot";
import { colors } from "@/src/style/tokens";
import type { StampFrame } from "@/src/utils/stamp/types";

type Props = {
  variant: StampFrame;
  /** 選択中は濃い色で描く */
  selected?: boolean;
};

/** フレームの意匠を 48x48 で示すサムネイル。デザイン変更UIの選択肢に並べる */
export function FrameThumb({ variant, selected = false }: Props) {
  const color = selected ? colors.textMuted : colors.textPlaceholder;

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
          <FrameDot x={21} y={0} color={color} />
          <FrameDot x={21} y={43} color={color} />
          <FrameDot x={0} y={21} color={color} />
          <FrameDot x={43} y={21} color={color} />
        </>
      )}
    </View>
  );
}
