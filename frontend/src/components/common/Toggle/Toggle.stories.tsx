import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { Toggle } from "./Toggle";

const meta = {
  component: Toggle,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, alignItems: "flex-start", padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { value: false, onValueChange: fn() },
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: { value: false },
};

export const On: Story = {
  args: { value: true },
};

export const Disabled: Story = {
  args: { value: true, disabled: true },
};

export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = React.useState(args.value);
    return (
      <Toggle
        {...args}
        value={value}
        onValueChange={(next) => {
          args.onValueChange(next);
          setValue(next);
        }}
      />
    );
  },
};
