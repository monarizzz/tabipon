import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { SpotNameLabel } from "./SpotNameLabel";

const meta = {
  component: SpotNameLabel,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    spotName: "東京スカイツリー",
    onPress: fn(),
  },
} satisfies Meta<typeof SpotNameLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { spotName: "" },
};

// 幅が足りないとき、鉛筆アイコンを押し出さずに名前側だけが省略されることを見る。
// 画面幅に左右されないよう、置き場より狭い幅で囲む
export const LongSpotName: Story = {
  args: { spotName: "東京スカイツリータウン ソラマチ 展望デッキ フロア 350" },
  decorators: [
    (Story) => (
      <View style={{ width: 240, alignItems: "center" }}>
        <Story />
      </View>
    ),
  ],
};
