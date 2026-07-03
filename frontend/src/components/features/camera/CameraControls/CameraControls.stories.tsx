import type { Meta, StoryObj } from "@storybook/react-native";
import { fn } from "storybook/test";

import { CameraControls } from "./CameraControls";

const meta = {
  component: CameraControls,
  tags: ["autodocs"],
  args: {
    flashOn: false,
    onToggleFlash: fn(),
    onCapture: fn(),
    onFlipCamera: fn(),
  },
} satisfies Meta<typeof CameraControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FlashOn: Story = {
  args: { flashOn: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
