import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View, Text, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { fn } from "storybook/test";

import { CollectionSheet } from "./CollectionSheet";
import { colors } from "@/src/theme/tokens";

const meta = {
  title: "features/album/stamp-rally/CollectionSheet",
  component: CollectionSheet,
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Story />
      </GestureHandlerRootView>
    ),
  ],
  tags: ["autodocs"],
  args: {
    onChangeName: fn(),
    onAdd: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof CollectionSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: { visible: false, name: "" },
  render: function Render(args) {
    const [visible, setVisible] = React.useState(false);
    const [name, setName] = React.useState(args.name);

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
          <Text style={{ color: colors.textPrimary }}>コレクションを追加</Text>
        </TouchableOpacity>
        <CollectionSheet
          {...args}
          visible={visible}
          name={name}
          onChangeName={(value) => {
            args.onChangeName(value);
            setName(value);
          }}
          onClose={() => {
            args.onClose();
            setVisible(false);
          }}
          onAdd={() => {
            args.onAdd();
            setVisible(false);
          }}
        />
      </View>
    );
  },
};
