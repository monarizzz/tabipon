import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { StampDetailMediaPager } from "./StampDetailMediaPager";

const meta = {
  component: StampDetailMediaPager,
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
    latitude: 35.7100627,
    longitude: 139.8107004,
    onPressDesignChange: fn(),
    onPressSpotName: fn(),
  },
} satisfies Meta<typeof StampDetailMediaPager>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// スポット名はページャの外に 1 つだけ置くので、未入力・長い名前のときの
// 見え方は写真ページと地図ページで共通になる
export const NoSpotName: Story = {
  args: { spotName: "" },
};

export const LongSpotName: Story = {
  args: { spotName: "東京スカイツリータウン ソラマチ 展望デッキ フロア 350" },
};
