import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { LineArtComparison } from "./LineArtComparison";

// #121 の判定ゲート用。現行 backend (OpenCV) の線画と Skia (SkSL) の線画を
// 左右に並べ、実機で見比べるためのストーリー。
// Jest では Skia がモックされるため右側は描画されない（描画できることの確認は
// 実機の Storybook で行う）。#122 / #123 の完了時にこのストーリーごと削除する。
const meta = {
  component: LineArtComparison,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof LineArtComparison>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 初期表示は平等院（エッジの多い主サンプル）。ボタンで雪山に切り替えられる */
export const Default: Story = {};
