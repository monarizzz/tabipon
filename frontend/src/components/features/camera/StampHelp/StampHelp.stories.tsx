import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { StampHelp } from "./StampHelp";
import { colors } from "@/src/theme/tokens";

const meta = {
  title: "features/camera/InstructionSheet",
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
  args: { visible: true },
} satisfies Meta<typeof StampHelp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
