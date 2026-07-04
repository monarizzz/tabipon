import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { DesignChangePanel } from "./DesignChangePanel";
import {
  FRAME_STYLE_OPTIONS,
  STAMP_COLOR_OPTIONS,
} from "@/src/components/features/camera/DesignChangeSheet/frameStyleOptions";

const meta = {
  component: DesignChangePanel,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    frameStyles: FRAME_STYLE_OPTIONS,
    colorOptions: STAMP_COLOR_OPTIONS,
    onBack: fn(),
    onShare: fn(),
    onSelectFrameStyle: fn(),
    onSelectColor: fn(),
    onToggleShowLandmarkName: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof DesignChangePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    selectedFrameStyleId: "classic",
    selectedColor: STAMP_COLOR_OPTIONS[0],
    showLandmarkName: true,
  },
  render: function Render(args) {
    const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
      args.selectedFrameStyleId,
    );
    const [selectedColor, setSelectedColor] = React.useState(
      args.selectedColor,
    );
    const [showLandmarkName, setShowLandmarkName] = React.useState(
      args.showLandmarkName,
    );

    return (
      <DesignChangePanel
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
        showLandmarkName={showLandmarkName}
        onToggleShowLandmarkName={(value) => {
          args.onToggleShowLandmarkName(value);
          setShowLandmarkName(value);
        }}
      />
    );
  },
};
