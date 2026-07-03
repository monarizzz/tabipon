import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";
import { Palette } from "lucide-react-native";

import { CommonButton } from "./CommonButton";
import { colors } from "@/src/theme/tokens";

const meta = {
  component: CommonButton,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, alignItems: "flex-start", padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { onPress: fn(), label: "Button" },
} satisfies Meta<typeof CommonButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Accent: Story = {
  args: { variant: "accent", label: "アルバムへ" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true },
};

export const WithIcon: Story = {
  args: {
    variant: "secondary",
    label: "デザインを変更する",
    icon: <Palette size={14} color={colors.secondary} />,
  },
};
