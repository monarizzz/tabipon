import { I18n } from "i18n-js";
import { getLocales } from "expo-localization";
import { ja } from "./constants/ja";
import { en } from "./constants/en";
import { zh } from "./constants/zh";
import { ko } from "./constants/ko";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./constants/locales";
import type { LocalePreference, SupportedLocale } from "./types/i18n";

export const i18n = new I18n(
  { ja, en, zh, ko },
  { defaultLocale: DEFAULT_LOCALE, enableFallback: true },
);

/** 端末のロケール一覧から対応言語を探す。見つからなければ既定言語。 */
export function resolveDeviceLocale(): SupportedLocale {
  for (const { languageCode } of getLocales()) {
    if (
      languageCode &&
      (SUPPORTED_LOCALES as readonly string[]).includes(languageCode)
    ) {
      return languageCode as SupportedLocale;
    }
  }
  return DEFAULT_LOCALE;
}

/** 設定（"system" or 具体的な言語）から実効ロケールを求める。 */
export function effectiveLocale(pref: LocalePreference): SupportedLocale {
  return pref === "system" ? resolveDeviceLocale() : pref;
}
