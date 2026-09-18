import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import { colors } from "@/src/style/tokens";
import { SpotNameLabel } from "./SpotNameLabel";

const meta = {
  component: SpotNameLabel,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    spotName: "東京スカイツリー",
    onPress: fn(),
  },
} satisfies Meta<typeof SpotNameLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { spotName: "" },
};

/** 破線が hitSlop 込みの実効タップ領域（44pt 四方）。文字がその内側に収まることを見る。 */
const tapAreaDecorator = (Story: () => React.ReactElement) => (
  <View
    style={{
      minWidth: 44,
      minHeight: 44,
      alignSelf: "flex-start",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
    }}
  >
    <Story />
  </View>
);

export const TapArea: Story = {
  decorators: [tapAreaDecorator],
};

/** 1 文字でも 44pt の帯に収まること（横方向の hitSlop が効く条件）を見る。 */
export const TapAreaSingleCharacter: Story = {
  args: { spotName: "山" },
  decorators: [tapAreaDecorator],
};

// 幅が足りないとき、鉛筆アイコンを押し出さずに名前側だけが省略されることを見る。
// 画面幅に左右されないよう、置き場より狭い幅で囲む
export const LongSpotName: Story = {
  args: { spotName: "東京スカイツリータウン ソラマチ 展望デッキ フロア 350" },
  decorators: [
    (Story) => (
      <View style={{ width: 240, alignItems: "center" }}>
        <Story />
      </View>
    ),
  ],
};
