import type { Meta, StoryObj } from "@storybook/react-native";
import { View, Text } from "react-native";
import { fn } from "storybook/test";

import { NavBar } from "./NavBar";
import { colors } from "@/src/theme/tokens";

const meta = {
  component: NavBar,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { title: "写真を調整", onBack: fn() },
} satisfies Meta<typeof NavBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoBack: Story = {
  args: { onBack: undefined, title: "マイページ" },
};

export const WithRightAction: Story = {
  args: {
    title: "マイページ",
    onBack: undefined,
    onRightPress: fn(),
    rightIcon: <Text style={{ color: colors.textMuted, fontSize: 14 }}>⚙︎</Text>,
  },
};
