import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { PhotoCropArea } from "./PhotoCropArea";

const meta = {
  component: PhotoCropArea,
  decorators: [
    (Story) => (
      <View style={{ height: 466 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof PhotoCropArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPhoto: Story = {
  args: { imageUri: "https://picsum.photos/seed/crop/400/600" },
};
