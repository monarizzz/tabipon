import {
  TAB_DEFINITIONS,
  type TabKey,
} from "@/src/commons/layout/constants/tabDefinitions";

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
