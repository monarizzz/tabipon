import type { Meta, StoryObj } from "@storybook/react-native";

import { AlbumMain } from "./AlbumMain";

const STAMPS = [
  {
    id: "1",
    name: "東京タワー",
    date: "2026/09/18",
    obtained: true,
  },
  {
    id: "2",
    name: "名称未設定",
    nameUnset: true,
    date: "2026/09/17",
    obtained: true,
  },
];

const meta = {
  component: AlbumMain,
  tags: ["autodocs"],
  args: {
    stamps: STAMPS,
    loadFailed: false,
    refreshing: false,
    reload: () => {},
    refresh: () => {},
    pressStamp: () => {},
    startStamp: () => {},
  },
} satisfies Meta<typeof AlbumMain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 読み込み中。`stamps` が null の間はスピナーだけ出す */
export const Loading: Story = {
  args: { stamps: null },
};

/** 0 件。撮影画面への導線を出し、下に引いて再読み込みできる */
export const Empty: Story = {
  args: { stamps: [] },
};

/** 読み込みに失敗したとき。再読み込みのボタンを出す */
export const LoadFailed: Story = {
  args: { stamps: null, loadFailed: true },
};
