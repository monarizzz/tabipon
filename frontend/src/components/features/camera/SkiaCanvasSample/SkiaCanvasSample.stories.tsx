import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { SkiaCanvasSample } from "./SkiaCanvasSample";

const meta = {
  component: SkiaCanvasSample,
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
} satisfies Meta<typeof SkiaCanvasSample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
