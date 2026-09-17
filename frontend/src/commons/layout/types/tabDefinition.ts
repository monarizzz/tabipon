import type { Href } from "expo-router";
import type { TranslationKey } from "@/src/libs/i18n/types/i18n";
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
