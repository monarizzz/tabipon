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

/** 破線が hitSlop 込みの実効タップ領域（44pt）。文字がその内側に収まることを見る。 */
export const TapArea: Story = {
  decorators: [
    (Story) => (
      <View
        style={{
          minHeight: 44,
          justifyContent: "center",
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: "#c3d6cf",
        }}
      >
        <Story />
      </View>
    ),
  ],
};
