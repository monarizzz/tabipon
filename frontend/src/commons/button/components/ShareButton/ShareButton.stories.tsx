import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { ShareButton } from "./ShareButton";

const meta = {
  component: ShareButton,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, alignItems: "flex-start", padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { onPress: fn() },
} satisfies Meta<typeof ShareButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 32 },
};

export const Large: Story = {
  args: { size: 64 },
};

export const WithStyle: Story = {
  args: { style: { alignSelf: "flex-end", marginTop: 24 } },
};
