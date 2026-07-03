import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { StampDoneActions } from "./StampDoneActions";

const meta = {
  component: StampDoneActions,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    memo: "",
    onChangeMemo: fn(),
    onContinueShooting: fn(),
    onGoToAlbum: fn(),
  },
} satisfies Meta<typeof StampDoneActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
