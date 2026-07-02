import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View, Text, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { fn } from "storybook/test";

import { BottomSheet } from "./BottomSheet";
import { colors } from "@/src/theme/tokens";

const meta = {
  component: BottomSheet,
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Story />
      </GestureHandlerRootView>
    ),
  ],
  tags: ["autodocs"],
  args: { onClose: fn() },
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: { visible: false, children: null },
  render: function Render(args) {
    const [visible, setVisible] = React.useState(false);
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
          <Text style={{ color: colors.textPrimary }}>Open sheet</Text>
        </TouchableOpacity>
        <BottomSheet
          {...args}
          visible={visible}
          onClose={() => {
            args.onClose();
            setVisible(false);
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            デザインを変更する
          </Text>
        </BottomSheet>
      </View>
    );
  },
};
