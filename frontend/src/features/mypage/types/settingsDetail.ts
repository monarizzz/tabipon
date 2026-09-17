import type { TranslationKey } from "@/src/libs/i18n/types/i18n";

/**
 * 設定の詳細画面の状態と操作。`useSettingsDetail()` が返し、
 * `<SettingsDetailMain />` が受け取る
 */
export type SettingsDetail = {
  /** 見出しの翻訳キー。文言の解決は Main の中で行う */
  titleKey: TranslationKey;
  back: () => void;
};
