import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { StampPreview } from "./StampPreview";

// `src/utils/stamp/` のパイプラインを実機で走らせて目視するためのストーリー。
// これを呼ぶ画面はまだ無い（結線は #125）ので、現状ここが唯一の実行経路になる。
//
// **Jest では Skia がモックされて `useImage` が null を返すため、生成は走らない。**
// スモークテストが見るのは「例外を投げずに描画できること」までで、
// 出力そのものの確認は実機の Storybook（`npm run storybook:ios`）で行う。
// #129 のとおり Skia を使うストーリーは Web の Storybook では表示できない。
const meta = {
  component: StampPreview,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof StampPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 初期表示は red の 4 フレーム。色と仕上げはボタンで切り替える */
export const Default: Story = {};
