import type { Meta, StoryObj } from "@storybook/react-native";

import { RECENT_COLLECTIONS } from "@/src/features/mypage/constants/recentCollections";

import { MypageMain } from "./MypageMain";

const meta = {
  component: MypageMain,
  tags: ["autodocs"],
  args: {
    recentCollections: RECENT_COLLECTIONS,
    pressSeeAllCollections: () => {},
    pressMenu: () => {},
  },
} satisfies Meta<typeof MypageMain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 獲得したコレクションがまだ無いとき */
export const NoCollections: Story = {
  args: { recentCollections: [] },
};
