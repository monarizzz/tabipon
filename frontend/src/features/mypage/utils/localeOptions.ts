import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
} from "@/src/libs/i18n/constants/locales";
import type { I18nContextValue } from "@/src/libs/i18n/types/i18n";
import type { LocaleOption } from "@/src/features/mypage/types/language";

/**
 * 言語設定の選択肢を組み立てる。
 *
 * 先頭は「端末の設定に従う」。対応言語はネイティブ表記のまま出すので翻訳しない
 * （`LOCALE_LABELS`）。並び順は `SUPPORTED_LOCALES` に従う。
 */
export function localeOptions(t: I18nContextValue["t"]): LocaleOption[] {
  return [
    { key: "system", label: t("language.system") },
    ...SUPPORTED_LOCALES.map((code) => ({
      key: code,
      label: LOCALE_LABELS[code],
    })),
  ];
}
