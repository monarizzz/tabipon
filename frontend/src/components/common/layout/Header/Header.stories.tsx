import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { Header } from "./Header";

const meta = {
  component: Header,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, alignItems: "stretch", padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: "アルバム" },
};

export const WithSubtitle: Story = {
  args: { title: "アルバム", subtitle: "スタンプ 12枚" },
};
