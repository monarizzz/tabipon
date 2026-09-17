import { useRouter } from "expo-router";

import type { Language } from "@/src/features/mypage/types/language";
import { localeOptions } from "@/src/features/mypage/utils/localeOptions";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";

/**
 * 言語設定の状態と操作をまとめて持つ。
 *
 * 値そのものは `I18nProvider` にあり、ここはそれを画面向けに並べ直すだけ。
 * 選択中の言語と切り替えを props で渡せるようにして、`<LanguageMain />` が
 * Provider を知らずに描けるようにする。
 */
export function useLanguage(): Language {
  const router = useRouter();
  const { t, preference, setPreference } = useTranslation();

  return {
    options: localeOptions(t),
    preference,
    selectPreference: setPreference,
    back: router.back,
  };
}
