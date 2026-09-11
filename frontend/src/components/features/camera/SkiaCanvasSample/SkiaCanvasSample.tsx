import { Canvas, Circle } from "@shopify/react-native-skia";
import { StyleSheet } from "react-native";
import { colors } from "@/src/theme/tokens";

// #119: @shopify/react-native-skia の導入確認用コンポーネント。
// Canvas 上に円を1つ描くだけで、Skia のネイティブモジュールが
// 動作していることを目視確認する。Skia は Expo SDK 54 の Expo Go に
// 同梱されているため、Storybook (npm run storybook:ios など) から
// そのまま確認できる。
// 画像処理そのものはこの Issue の範囲外（#121〜#123 で実装する）。
// #123 でスタンプ生成関数が完成したら、この検証用コンポーネントは削除する
const SIZE = 120;

export function SkiaCanvasSample() {
  return (
    <Canvas style={styles.canvas}>
      <Circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={SIZE / 2 - 4}
        color={colors.primary}
      />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: SIZE,
    height: SIZE,
  },
});
