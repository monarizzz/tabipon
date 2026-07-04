import React from "react";
import type { Meta } from "@storybook/react-native";
import { View, Text, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { fn } from "storybook/test";

import { EditFieldSheet, type EditFieldSheetProps } from "./EditFieldSheet";
import { colors } from "@/src/theme/tokens";

const meta = {
  component: EditFieldSheet,
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Story />
      </GestureHandlerRootView>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof EditFieldSheet>;

export default meta;

export const TextField = {
  args: {
    visible: false,
    title: "タイトルを編集",
    mode: "text",
    value: "",
    onChangeValue: fn(),
    onClose: fn(),
    onSave: fn(),
  },
  render: function Render(args: EditFieldSheetProps) {
    const [visible, setVisible] = React.useState(false);
    const [value, setValue] = React.useState(
      args.mode === "text" ? args.value : "",
    );

    return (
      <View style={{ flex: 1, padding: 16 }}>
        <TouchableOpacity
          onPress={() => setVisible(true)}
          style={{ padding: 12, backgroundColor: colors.surface, borderRadius: 12 }}
        >
          <Text style={{ color: colors.textPrimary }}>タイトルを編集する</Text>
        </TouchableOpacity>
        <EditFieldSheet
          {...args}
          mode="text"
          visible={visible}
          value={value}
          onChangeValue={setValue}
          onClose={() => setVisible(false)}
          onSave={() => setVisible(false)}
        />
      </View>
    );
  },
};

export const DateField = {
  args: {
    visible: false,
    title: "日付を編集",
    mode: "date",
    value: new Date(),
    onChangeValue: fn(),
    onClose: fn(),
    onSave: fn(),
  },
  render: function Render(args: EditFieldSheetProps) {
    const [visible, setVisible] = React.useState(false);
    const [value, setValue] = React.useState(
      args.mode === "date" ? args.value : new Date(),
    );

    return (
      <View style={{ flex: 1, padding: 16 }}>
        <TouchableOpacity
          onPress={() => setVisible(true)}
          style={{ padding: 12, backgroundColor: colors.surface, borderRadius: 12 }}
        >
          <Text style={{ color: colors.textPrimary }}>日付を編集する</Text>
        </TouchableOpacity>
        <EditFieldSheet
          {...args}
          mode="date"
          visible={visible}
          value={value}
          onChangeValue={setValue}
          onClose={() => setVisible(false)}
          onSave={() => setVisible(false)}
        />
      </View>
    );
  },
};
