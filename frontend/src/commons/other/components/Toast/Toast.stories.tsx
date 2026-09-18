import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { Toast } from "./Toast";

const meta = {
  component: Toast,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { message: "投稿用の文章をコピーしました" },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** `message` が `null` の間は何も描かない */
export const Hidden: Story = {
  args: { message: null },
};
