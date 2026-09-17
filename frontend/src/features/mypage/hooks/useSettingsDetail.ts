import { useRouter } from "expo-router";

import type { SettingsDetail } from "@/src/features/mypage/types/settingsDetail";
import type { TranslationKey } from "@/src/libs/i18n/types/i18n";

/**
 * 設定メニューから開く詳細画面の状態と操作をまとめて持つ。
 *
 * 通知・プライバシー・ヘルプで共通。画面ごとに違うのは見出しだけなので、
 * 翻訳キーを受け取ってそのまま返す。
 */
export function useSettingsDetail(titleKey: TranslationKey): SettingsDetail {
  const router = useRouter();

  return {
    titleKey,
    back: router.back,
  };
}
