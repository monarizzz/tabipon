import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { StampInfoCard } from "./StampInfoCard";

const meta = {
  component: StampInfoCard,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    date: "2026.06.28",
    location: "東京・墨田区",
    memo: "晴れた日に行ってきた！展望台からの眺めが最高だった。",
    onPressDate: fn(),
    onPressLocation: fn(),
    onPressMemo: fn(),
  },
} satisfies Meta<typeof StampInfoCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoMemo: Story = {
  args: { memo: undefined },
};
