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
