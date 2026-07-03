import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { StampHelp } from "./StampHelp";
import { colors } from "@/src/theme/tokens";

const meta = {
  component: StampHelp,
  decorators: [
    (Story) => (
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: colors.textPrimary,
        }}
      >
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { visible: true, onClose: fn() },
} satisfies Meta<typeof StampHelp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
