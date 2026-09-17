import type { Meta, StoryObj } from "@storybook/react-native";

import type { LocaleOption } from "@/src/features/mypage/types/language";

import { LanguageMain } from "./LanguageMain";

// 言語名はネイティブ表記のまま出すので翻訳しない（`localeOptions()`）
const OPTIONS: LocaleOption[] = [
  { key: "system", label: "端末の設定に従う" },
  { key: "ja", label: "日本語" },
  { key: "en", label: "English" },
  { key: "zh", label: "简体中文" },
  { key: "ko", label: "한국어" },
];

const meta = {
  component: LanguageMain,
  tags: ["autodocs"],
  args: {
    options: OPTIONS,
    preference: "system",
    selectPreference: () => {},
    back: () => {},
  },
} satisfies Meta<typeof LanguageMain>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 端末の設定に従っている状態。既定値 */
export const FollowingSystem: Story = {};

/** 手動で言語を選んだ状態。選んだ行にチェックが付く */
export const LocaleSelected: Story = {
  args: { preference: "en" },
};
