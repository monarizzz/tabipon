import type { SUPPORTED_LOCALES } from "../constants/locales";
import type { Translations } from "../constants/ja";

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** 手動で言語を選んでいない場合は "system"（端末設定に追従）。 */
export type LocalePreference = SupportedLocale | "system";

// Translations のネスト構造から "album.title" のようなドットキー型を導出する。
type LeafKeys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafKeys<T[K]>}`;
}[keyof T & string];

export type TranslationKey = LeafKeys<Translations>;

/** t() の第2引数。i18n-js の補間（`%{name}`）に渡す値。 */
export type TranslateOptions = Record<string, string | number>;

export type I18nContextValue = {
  /** 実際に表示に使われている言語 */
  locale: SupportedLocale;
  /** ユーザー設定（"system" なら端末設定に追従） */
  preference: LocalePreference;
  /** 言語設定を変更して永続化する */
  setPreference: (pref: LocalePreference) => void;
  t: (key: TranslationKey, options?: TranslateOptions) => string;
};
