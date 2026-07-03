import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { Badge } from "./Badge";

const meta = {
  component: Badge,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, alignItems: "flex-start", padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { label: "Badge" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomColor: Story = {
  args: { color: "#16A34A" },
};
