import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import { fn } from "storybook/test";
import { Camera, Image, User } from "lucide-react-native";

import { TabBar, type TabBarItemData } from "./TabBar";

const baseItems: (activeKey: string) => TabBarItemData[] = (activeKey) => [
  {
    key: "camera",
    label: "カメラ",
    icon: Camera,
    active: activeKey === "camera",
    onPress: fn(),
  },
  {
    key: "album",
    label: "アルバム",
    icon: Image,
    active: activeKey === "album",
    onPress: fn(),
  },
  {
    key: "mypage",
    label: "マイページ",
    icon: User,
    active: activeKey === "mypage",
    onPress: fn(),
  },
];

const meta = {
  component: TabBar,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof TabBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CameraActive: Story = {
  args: { items: baseItems("camera") },
};

export const AlbumActive: Story = {
  args: { items: baseItems("album") },
};

export const MypageActive: Story = {
  args: { items: baseItems("mypage") },
};
