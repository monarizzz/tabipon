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
