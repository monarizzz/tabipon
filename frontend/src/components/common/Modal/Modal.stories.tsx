import type { Meta, StoryObj } from "@storybook/react-native";
import { Text } from "react-native";
import { fn } from "storybook/test";

import { Modal } from "./Modal";

const meta = {
  component: Modal,
  tags: ["autodocs"],
  args: { onClose: fn() },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    visible: true,
    children: <Text>Modal content</Text>,
  },
};
