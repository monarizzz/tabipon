import type { Meta, StoryObj } from "@storybook/react-native";
import { fn } from "storybook/test";

import { DbErrorScreen } from "./DbErrorScreen";

const meta = {
  component: DbErrorScreen,
  tags: ["autodocs"],
  args: { onRetry: fn() },
} satisfies Meta<typeof DbErrorScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** DB のバージョンがアプリの想定より新しいとき（migrations.ts が投げる文言） */
export const VersionMismatch: Story = {
  args: {
    detail: "DB のバージョン (3) がアプリの想定 (2) より新しい",
  },
};

/** 例外からメッセージを取れなかったとき */
export const WithoutDetail: Story = {
  args: { detail: undefined },
};
