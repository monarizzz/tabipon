import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { DesignChangeForm } from "./DesignChangeForm";
import { FRAME_STYLE_OPTIONS } from "@/src/features/camera/constants/frameStyleOptions";
import {
  DEFAULT_STAMP_COLOR,
  STAMP_INK_COLORS,
} from "@/src/utils/stamp/constants/constants";
import { spacing } from "@/src/style/tokens";

const meta = {
  component: DesignChangeForm,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: spacing.xl }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    frameStyles: FRAME_STYLE_OPTIONS,
    colorOptions: STAMP_INK_COLORS,
    onSelectFrameStyle: fn(),
    onSelectColor: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof DesignChangeForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    selectedFrameStyleId: "classic",
    selectedColor: DEFAULT_STAMP_COLOR,
  },
  render: function Render(args) {
    const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
      args.selectedFrameStyleId,
    );
    const [selectedColor, setSelectedColor] = React.useState(
      args.selectedColor,
    );

    return (
      <DesignChangeForm
        {...args}
        selectedFrameStyleId={selectedFrameStyleId}
        onSelectFrameStyle={(id) => {
          args.onSelectFrameStyle(id);
          setSelectedFrameStyleId(id);
        }}
        selectedColor={selectedColor}
        onSelectColor={(color) => {
          args.onSelectColor(color);
          setSelectedColor(color);
        }}
      />
    );
  },
};

export const Confirming: Story = {
  args: {
    selectedFrameStyleId: "classic",
    selectedColor: DEFAULT_STAMP_COLOR,
    confirming: true,
  },
};
