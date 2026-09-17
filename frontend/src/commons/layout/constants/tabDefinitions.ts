import type { Href } from "expo-router";
import { Camera, Image, User } from "lucide-react-native";
import type { TranslationKey } from "@/src/libs/i18n/types/i18n";
import { colors } from "@/src/style/tokens";
import type { TabBarIcon } from "@/src/commons/layout/components/TabBar/TabBar";

export type TabKey = "index" | "album" | "mypage";

export type TabDefinition = {
  /** (tabs) 配下のルート名。TabBar のキーにもそのまま使う */
  key: TabKey;
  labelKey: TranslationKey;
  icon: TabBarIcon;
  /** タブ外の画面から遷移するときの行き先 */
  href: Href;
  /** usePathname() が返すパス。グループ (tabs) は含まれない */
  pathname: string;
  /**
   * タブ配下ではないが、このタブに属するものとして扱うパス。
   * 撮影フローの 3 画面はルート直下にあるが、機能としてはカメラタブの中にある
   */
  relatedPathnames?: readonly string[];
  activeColor: string;
};

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

/** パスが base 自身か、その配下かを判定する */
function isUnder(pathname: string, base: string): boolean {
  if (pathname === base) return true;
  // "/" は全パスの前方一致になってしまうので配下判定から外す
  return base !== "/" && pathname.startsWith(`${base}/`);
}

/**
 * 現在のパスに対応するタブを返す。
 * どのタブにも属さない画面では null になる。
 */
export function activeTabKey(pathname: string): TabKey | null {
  const matched = TAB_DEFINITIONS.find(
    (tab) =>
      isUnder(pathname, tab.pathname) ||
      (tab.relatedPathnames?.some((related) => isUnder(pathname, related)) ??
        false),
  );
  return matched?.key ?? null;
}
