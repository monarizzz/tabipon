import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";

import {
  RecentCollectionsSection,
  type RecentCollectionItem,
} from "./RecentCollectionsSection";

const ITEMS: RecentCollectionItem[] = [
  { id: "1", name: "浅草寺" },
  { id: "2", name: "スカイツリー" },
  { id: "3", name: "皇居" },
];

const meta = {
  component: RecentCollectionsSection,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    items: ITEMS,
    onPressSeeAll: fn(),
    onPressItem: fn(),
  },
} satisfies Meta<typeof RecentCollectionsSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
