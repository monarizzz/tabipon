import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { ScanOverlay } from "./ScanOverlay";

const meta = {
  component: ScanOverlay,
  decorators: [
    (Story) => (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          backgroundColor: "#000000",
        }}
      >
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof ScanOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
