import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View, Text, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { fn } from "storybook/test";

import { DesignChangeSheet } from "./DesignChangeSheet";
import { FRAME_STYLE_OPTIONS } from "@/src/features/camera/constants/frameStyleOptions";
import {
  DEFAULT_STAMP_COLOR,
  STAMP_INK_COLORS,
} from "@/src/utils/stamp/constants/constants";
import { colors } from "@/src/style/tokens";

const meta = {
  component: DesignChangeSheet,
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Story />
      </GestureHandlerRootView>
    ),
  ],
  tags: ["autodocs"],
  args: {
    frameStyles: FRAME_STYLE_OPTIONS,
    colorOptions: STAMP_INK_COLORS,
    onSelectFrameStyle: fn(),
    onSelectColor: fn(),
    onConfirm: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof DesignChangeSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    visible: false,
    selectedFrameStyleId: "classic",
    selectedColor: DEFAULT_STAMP_COLOR,
  },
  render: function Render(args) {
    const [visible, setVisible] = React.useState(false);
    const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
      args.selectedFrameStyleId,
    );
    const [selectedColor, setSelectedColor] = React.useState(
      args.selectedColor,
    );

    return (
      <View style={{ flex: 1, padding: 16 }}>
        <TouchableOpacity
          onPress={() => setVisible(true)}
          style={{
            padding: 12,
            backgroundColor: colors.surface,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.textPrimary }}>デザインを変更する</Text>
        </TouchableOpacity>
        <DesignChangeSheet
          {...args}
          visible={visible}
          onClose={() => {
            args.onClose();
            setVisible(false);
          }}
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
      </View>
    );
  },
};
