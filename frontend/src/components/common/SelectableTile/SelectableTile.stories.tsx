import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { SelectableTile } from "./SelectableTile";
import { colors } from "@/src/theme/tokens";

const Thumb = ({ color = colors.textPlaceholder }: { color?: string }) => (
  <View
    style={{
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2.5,
      borderColor: color,
    }}
  />
);

const meta = {
  component: SelectableTile,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, alignItems: "flex-start", padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { label: "クラシック", onPress: fn(), children: <Thumb /> },
} satisfies Meta<typeof SelectableTile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true, children: <Thumb color={colors.textMuted} /> },
};

export const Row: Story = {
  render: (args) => (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <SelectableTile {...args} label="クラシック" selected>
        <Thumb color={colors.textMuted} />
      </SelectableTile>
      <SelectableTile {...args} label="ヴィンテージ">
        <Thumb />
      </SelectableTile>
      <SelectableTile {...args} label="ミニマル">
        <Thumb />
      </SelectableTile>
    </View>
  ),
};
