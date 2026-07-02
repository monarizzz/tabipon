import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import {
  SettingsMenuSection,
  type SettingsMenuItem,
} from "./SettingsMenuSection";

const ITEMS: SettingsMenuItem[] = [
  { id: "notifications", label: "通知設定", onPress: fn() },
  { id: "privacy", label: "プライバシー", onPress: fn() },
  { id: "help", label: "ヘルプ", onPress: fn() },
];

const meta = {
  component: SettingsMenuSection,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { items: ITEMS },
} satisfies Meta<typeof SettingsMenuSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
