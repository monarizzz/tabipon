import { View } from "react-native";

type Props = {
  /** 親の左上を原点とした位置 */
  x: number;
  y: number;
  color: string;
  size?: number;
};

/** フレームの意匠に使う点。位置は親に対する絶対配置で指定する */
export function FrameDot({ x, y, color, size = 5 }: Props) {
  return (
    <View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}
