import type { Meta, StoryObj } from "@storybook/react-native";

import { PhotoAdjustMain } from "./PhotoAdjustMain";

const meta = {
  component: PhotoAdjustMain,
  tags: ["autodocs"],
  args: {
    imageUri: undefined,
    zoom: 0,
    changeZoom: () => {},
    tabItems: [],
    discardDialogVisible: false,
    back: () => {},
    confirm: async () => {},
    cancelDiscard: () => {},
    confirmDiscard: () => {},
  },
} satisfies Meta<typeof PhotoAdjustMain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** タブへ移ろうとして、調整中の写真を捨てるか聞いている状態 */
export const DiscardConfirm: Story = {
  args: { discardDialogVisible: true },
};
