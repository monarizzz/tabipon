import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { StampLocationMap } from "./StampLocationMap";

const meta = {
  component: StampLocationMap,
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
  },
} satisfies Meta<typeof StampLocationMap>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// 座標が無いスタンプ。それらしい地図を出すと行ってもいない場所を見せることになるので、
// 文字で「出せない」とだけ伝える
export const NoLocation: Story = {
  args: { latitude: null, longitude: null },
};
