import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { StampShowcase } from "./StampShowcase";

const meta = {
  component: StampShowcase,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { onShare: fn() },
} satisfies Meta<typeof StampShowcase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
