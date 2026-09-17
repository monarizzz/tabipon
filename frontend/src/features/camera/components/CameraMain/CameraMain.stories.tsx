import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";

import { CameraMain } from "./CameraMain";

const meta = {
  component: CameraMain,
  tags: ["autodocs"],
  args: {
    permissionGranted: true,
    requestPermission: () => {},
    facing: "back",
    flash: "off",
    capturing: false,
    cameraRef: React.createRef(),
    changeContainerSize: () => {},
    capture: async () => {},
    toggleFlash: () => {},
    flipCamera: () => {},
  },
} satisfies Meta<typeof CameraMain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** カメラの権限をまだもらえていないとき */
export const PermissionRequired: Story = {
  args: { permissionGranted: false },
};

/** シャッターを押した直後。二度押しできないようにしている */
export const Capturing: Story = {
  args: { capturing: true },
};
