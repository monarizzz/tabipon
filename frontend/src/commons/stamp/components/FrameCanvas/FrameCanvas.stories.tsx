import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { colors } from "@/src/style/tokens";
import { STAMP_FRAMES } from "@/src/utils/stamp/types";

import { FrameCanvas } from "./FrameCanvas";

const meta = {
  component: FrameCanvas,
  args: { frame: "classic", color: colors.textMuted, size: 120 },
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
} satisfies Meta<typeof FrameCanvas>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Classic: Story = {};

export const Dash: Story = {
  args: { frame: "dash" },
};

export const Simple: Story = {
  args: { frame: "simple" },
};

export const Wave: Story = {
  args: { frame: "wave" },
};

/** サムネイルと同じ 48px。線幅も 48/512 に縮む */
export const Thumbnail: Story = {
  args: { size: 48 },
};

/** 押す画面のガイドと同じ 260px */
export const Guide: Story = {
  args: { size: 260 },
};

/** 全意匠を並べて見比べる */
export const AllFrames: Story = {
  render: () => (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {STAMP_FRAMES.map((frame) => (
        <FrameCanvas
          key={frame}
          frame={frame}
          color={colors.textMuted}
          size={80}
        />
      ))}
    </View>
  ),
};
