import type { Meta, StoryObj } from "@storybook/react-native";
import { View, Text } from "react-native";

import { Card } from "./Card";

const meta = {
  component: Card,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, alignItems: "flex-start", padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <Text>Card content</Text>,
  },
};
