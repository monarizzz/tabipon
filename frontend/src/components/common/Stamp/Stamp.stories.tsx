import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { Stamp } from "./Stamp";

const meta = {
  component: Stamp,
  decorators: [
    (Story) => (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof Stamp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};

export const Small: Story = {
  args: { size: 140 },
};

export const WithImage: Story = {
  args: {
    imageUri: "https://picsum.photos/seed/skytree/260/260",
  },
};

export const Muted: Story = {
  args: { size: 140, muted: true },
};
