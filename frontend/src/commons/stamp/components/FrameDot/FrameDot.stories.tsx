import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { colors } from "@/src/style/tokens";

import { FrameDot } from "./FrameDot";

const meta = {
  component: FrameDot,
  args: { x: 21, y: 21, color: colors.textPlaceholder },
  decorators: [
    // 絶対配置なので、基準になる 48x48 の枠の中に置いて見せる
    (Story) => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderWidth: 1,
            borderColor: colors.textPlaceholder,
          }}
        >
          <Story />
        </View>
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof FrameDot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TopLeft: Story = {
  args: { x: 0, y: 0 },
};

export const Selected: Story = {
  args: { color: colors.textMuted },
};

export const Large: Story = {
  args: { size: 12 },
};
