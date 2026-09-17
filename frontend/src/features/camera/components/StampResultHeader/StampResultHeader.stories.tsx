import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { StampResultHeader } from "./StampResultHeader";

const meta = {
  component: StampResultHeader,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof StampResultHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
