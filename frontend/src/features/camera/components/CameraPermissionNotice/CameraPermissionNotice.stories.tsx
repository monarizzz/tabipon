import type { Meta, StoryObj } from "@storybook/react-native";

import { CameraPermissionNotice } from "./CameraPermissionNotice";

const meta = {
  component: CameraPermissionNotice,
  tags: ["autodocs"],
  args: {
    canAskAgain: true,
    onRequestPermission: () => {},
    onOpenSettings: () => {},
  },
} satisfies Meta<typeof CameraPermissionNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

/** まだ一度も許可を求めていない・拒否されていない。アプリ内で許可を求められる */
export const CanAskAgain: Story = {};

/** 一度拒否済み。アプリからは権限ダイアログを出せないので設定アプリへ送る */
export const CannotAskAgain: Story = {
  args: { canAskAgain: false },
};
