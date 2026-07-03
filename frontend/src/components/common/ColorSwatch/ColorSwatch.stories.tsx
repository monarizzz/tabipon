import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { ColorSwatch } from "./ColorSwatch";

const meta = {
  component: ColorSwatch,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, alignItems: "flex-start", padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { color: "#3d9c77", onPress: fn() },
} satisfies Meta<typeof ColorSwatch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const Row: Story = {
  render: (args) => (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <ColorSwatch {...args} color="#333333" selected />
      <ColorSwatch {...args} color="#ff6b6b" />
      <ColorSwatch {...args} color="#fcc06d" />
      <ColorSwatch {...args} color="#6de8b9" />
      <ColorSwatch {...args} color="#6bc1ff" />
    </View>
  ),
};
