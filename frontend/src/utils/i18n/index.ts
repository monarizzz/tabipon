import { I18n } from "i18n-js";
import { getLocales } from "expo-localization";
import { ja, type Translations } from "./translations/ja";
import { en } from "./translations/en";
import { zh } from "./translations/zh";
import { ko } from "./translations/ko";

export const SUPPORTED_LOCALES = ["ja", "en", "zh", "ko"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** 手動で言語を選んでいない場合は "system"（端末設定に追従）。 */
export type LocalePreference = SupportedLocale | "system";

export const DEFAULT_LOCALE: SupportedLocale = "ja";

/** 設定画面の言語リスト表示に使う。ネイティブ表記。 */
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  ja: "日本語",
  en: "English",
  zh: "简体中文",
  ko: "한국어",
};

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

// Translations のネスト構造から "album.title" のようなドットキー型を導出する。
type LeafKeys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafKeys<T[K]>}`;
}[keyof T & string];

export type TranslationKey = LeafKeys<Translations>;
