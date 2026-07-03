import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { CameraHintBar } from "./CameraHintBar";

const meta = {
  component: CameraHintBar,
  decorators: [
    (Story) => (
      <View style={{ padding: 16, backgroundColor: "#ffffff" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof CameraHintBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
