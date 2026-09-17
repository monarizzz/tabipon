import type { Meta, StoryObj } from "@storybook/react-native";
import { Text } from "react-native";
import { fn } from "storybook/test";

import { ListItem } from "./ListItem";

const meta = {
  component: ListItem,
  tags: ["autodocs"],
  args: { label: "List item", onPress: fn() },
} satisfies Meta<typeof ListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRightElement: Story = {
  args: {
    rightElement: <Text>›</Text>,
  },
};

export const NotPressable: Story = {
  args: {
    onPress: undefined,
  },
};
