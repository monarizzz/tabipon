import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { CameraPreview } from "./CameraPreview";

const meta = {
  component: CameraPreview,
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
  args: {
    facing: "back",
    flash: "off",
  },
} satisfies Meta<typeof CameraPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
