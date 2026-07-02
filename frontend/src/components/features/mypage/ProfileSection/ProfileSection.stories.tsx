import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { ProfileSection } from "./ProfileSection";

const meta = {
  component: ProfileSection,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    name: "たびすたんぷ太郎",
    registeredDate: "2025.02.16",
  },
} satisfies Meta<typeof ProfileSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
