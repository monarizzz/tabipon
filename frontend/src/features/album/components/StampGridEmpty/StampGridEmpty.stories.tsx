import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { StampGridEmpty } from "./StampGridEmpty";

const meta = {
  component: StampGridEmpty,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof StampGridEmpty>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { onPressStart: fn() },
};

/** 導線を渡さない場合。見出しと説明だけになる */
export const WithoutAction: Story = {
  args: {},
};
