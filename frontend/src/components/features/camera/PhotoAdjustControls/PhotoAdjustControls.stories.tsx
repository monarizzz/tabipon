import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { fn } from "storybook/test";

import { PhotoAdjustControls } from "./PhotoAdjustControls";

const meta = {
  component: PhotoAdjustControls,
  tags: ["autodocs"],
  args: {
    onConfirm: fn(),
    onChangeZoom: fn(),
  },
} satisfies Meta<typeof PhotoAdjustControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { zoom: 0.5 },
  render: function Render(args) {
    const [zoom, setZoom] = React.useState(args.zoom);
    return <PhotoAdjustControls {...args} zoom={zoom} onChangeZoom={setZoom} />;
  },
};
