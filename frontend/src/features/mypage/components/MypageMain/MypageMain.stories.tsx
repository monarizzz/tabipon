import type { Meta, StoryObj } from "@storybook/react-native";

import { MypageMain } from "./MypageMain";

const meta = {
  component: MypageMain,
  tags: ["autodocs"],
  args: {
    pressMenu: () => {},
  },
} satisfies Meta<typeof MypageMain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
