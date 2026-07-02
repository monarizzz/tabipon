import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { View } from "react-native";
import { fn } from "storybook/test";

import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
  component: ConfirmDialog,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    visible: true,
    title: "編集内容を破棄しますか？",
    message: "タブを切り替えると、現在の編集内容が失われます。",
    confirmLabel: "破棄する",
    onCancel: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [visible, setVisible] = useState(args.visible);

    return (
      <ConfirmDialog
        {...args}
        visible={visible}
        onCancel={() => {
          args.onCancel();
          setVisible(false);
        }}
        onConfirm={() => {
          args.onConfirm();
          setVisible(false);
        }}
      />
    );
  },
};
