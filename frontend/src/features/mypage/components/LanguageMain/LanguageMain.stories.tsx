import type { Meta, StoryObj } from "@storybook/react-native";

import { LanguageMain } from "./LanguageMain";

const meta = {
  component: LanguageMain,
  tags: ["autodocs"],
  args: {
    onBack: () => {},
  },
} satisfies Meta<typeof LanguageMain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
