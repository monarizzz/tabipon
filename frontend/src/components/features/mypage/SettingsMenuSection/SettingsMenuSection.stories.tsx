import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { Bell, Shield, Info } from "lucide-react-native";
import { fn } from "storybook/test";

import {
  SettingsMenuSection,
  type SettingsMenuItem,
} from "./SettingsMenuSection";

const ITEMS: SettingsMenuItem[] = [
  { id: "notifications", label: "通知設定", icon: Bell, onPress: fn() },
  { id: "privacy", label: "プライバシー", icon: Shield, onPress: fn() },
  { id: "help", label: "ヘルプ", icon: Info, onPress: fn() },
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
