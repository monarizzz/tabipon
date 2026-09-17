import type { LocalePreference } from "@/src/libs/i18n/types/i18n";

export type LocaleOption = {
  key: LocalePreference;
  label: string;
};

/** 言語設定の状態と操作。`useLanguage()` が返し、`<LanguageMain />` が受け取る */
export type Language = {
  options: LocaleOption[];
  /** 選択中の設定。"system" なら端末設定に追従している */
  preference: LocalePreference;
  selectPreference: (preference: LocalePreference) => void;
  back: () => void;
};
