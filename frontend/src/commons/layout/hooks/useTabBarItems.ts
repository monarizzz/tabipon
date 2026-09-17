import { useMemo } from "react";
import { usePathname } from "expo-router";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import type { TabBarItemData } from "@/src/commons/layout/components/TabBar/TabBar";
import { TAB_DEFINITIONS } from "@/src/commons/layout/constants/tabDefinitions";
import type { TabDefinition } from "@/src/commons/layout/types/tabDefinition";
import { activeTabKey } from "@/src/commons/layout/utils/activeTabKey";

/**
 * タブ外の画面に置く TabBar の items を組み立てる。
 * 画面側は「タブを押したときに何をするか」だけを渡し、
 * どのタブが選択中かは現在のルートから決まる。
 */
export function useTabBarItems(
  onPressTab: (tab: TabDefinition) => void,
): TabBarItemData[] {
  const { t } = useTranslation();
  const pathname = usePathname();
  const currentKey = activeTabKey(pathname);

  return useMemo(
    () =>
      TAB_DEFINITIONS.map((tab) => ({
        key: tab.key,
        label: t(tab.labelKey),
        icon: tab.icon,
        active: tab.key === currentKey,
        activeColor: tab.activeColor,
        onPress: () => onPressTab(tab),
      })),
    [t, currentKey, onPressTab],
  );
}
