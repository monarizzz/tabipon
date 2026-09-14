import type { SupportedLocale } from "../types/i18n";

/** 対応言語。並び順は設定画面の言語リストの表示順になる。 */
export const SUPPORTED_LOCALES = ["ja", "en", "zh", "ko"] as const;

export const DEFAULT_LOCALE: SupportedLocale = "ja";

/** 設定画面の言語リスト表示に使う。ネイティブ表記。 */
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  ja: "日本語",
  en: "English",
  zh: "简体中文",
  ko: "한국어",
};
