import { Camera, Image, User } from "lucide-react-native";
import { colors } from "@/src/style/tokens";
import type { TabDefinition } from "@/src/commons/layout/types/tabDefinition";

/** タブの並び・文言・アイコンの唯一の定義。画面側はここを参照する */
export const TAB_DEFINITIONS: readonly TabDefinition[] = [
  {
    key: "index",
    labelKey: "tabs.camera",
    icon: Camera,
    href: "/(tabs)",
    pathname: "/",
    relatedPathnames: ["/photo-adjust", "/stamp-press", "/stamp-done"],
    activeColor: colors.primary,
  },
  {
    key: "album",
    labelKey: "tabs.album",
    icon: Image,
    href: "/(tabs)/album",
    pathname: "/album",
    activeColor: colors.primary,
  },
  {
    key: "mypage",
    labelKey: "tabs.mypage",
    icon: User,
    href: "/(tabs)/mypage",
    pathname: "/mypage",
    activeColor: colors.textPrimary,
  },
];
