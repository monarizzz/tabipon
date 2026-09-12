import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { StampVariantComparison } from "./StampVariantComparison";

// #122 の判定ゲート用。インク色 4 色 × フレーム 4 種の 16 通りを実機で描画し、
// #120 が書き出した現行 backend (OpenCV) の出力と切り替えて見比べるためのストーリー。
// Jest では Skia がモックされるため生成結果は描画されない（描画できることの確認は
// 実機の Storybook で行う）。#123 の完了時にこのストーリーごと削除する。
const meta = {
  component: StampVariantComparison,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof StampVariantComparison>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 初期表示は red の 4 フレーム。色はボタンで、OpenCV との比較は表示切替で行う */
export const Default: Story = {};
