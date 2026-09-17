import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { STAMP_FRAMES } from "@/src/utils/stamp/types";

import { FrameThumb } from "./FrameThumb";

const meta = {
  component: FrameThumb,
  args: { variant: "classic", selected: false },
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
} satisfies Meta<typeof FrameThumb>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Classic: Story = {};

export const Dash: Story = {
  args: { variant: "dash" },
};

export const Simple: Story = {
  args: { variant: "simple" },
};

export const Wave: Story = {
  args: { variant: "wave" },
};

export const Selected: Story = {
  args: { selected: true },
};

/** 全意匠を並べて見比べる */
export const AllVariants: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 16 }}>
      {STAMP_FRAMES.map((variant) => (
        <FrameThumb key={variant} variant={variant} />
      ))}
    </View>
  ),
};
