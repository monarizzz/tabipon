import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { colors } from "@/src/style/tokens";
import { STAMP_FRAMES } from "@/src/utils/stamp/types";

import { StampOrientationGuide } from "./StampOrientationGuide";

const meta = {
  component: StampOrientationGuide,
  args: { frameId: "classic", color: colors.secondary },
  decorators: [
    (Story) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof StampOrientationGuide>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Classic: Story = {};

export const Dash: Story = {
  args: { frameId: "dash" },
};

export const Simple: Story = {
  args: { frameId: "simple" },
};

export const Wave: Story = {
  args: { frameId: "wave" },
};

/** 全意匠を並べて見比べる */
export const AllFrames: Story = {
  render: () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {STAMP_FRAMES.map((frameId) => (
        <StampOrientationGuide
          key={frameId}
          frameId={frameId}
          color={colors.secondary}
          size={140}
        />
      ))}
    </View>
  ),
};
