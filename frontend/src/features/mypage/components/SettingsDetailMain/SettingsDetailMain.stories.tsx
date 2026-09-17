import type { Meta, StoryObj } from "@storybook/react-native";

import { SettingsDetailMain } from "./SettingsDetailMain";

const meta = {
  component: SettingsDetailMain,
  tags: ["autodocs"],
  args: {
    titleKey: "mypage.help",
    back: () => {},
  },
} satisfies Meta<typeof SettingsDetailMain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Help: Story = {};

export const Notifications: Story = {
  args: { titleKey: "mypage.notifications" },
};

export const Privacy: Story = {
  args: { titleKey: "mypage.privacy" },
};
