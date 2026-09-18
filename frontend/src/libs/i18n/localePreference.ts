import AsyncStorage from "@react-native-async-storage/async-storage";

import { SUPPORTED_LOCALES } from "./constants/locales";
import type { LocalePreference } from "./types/i18n";

const STORAGE_KEY = "app.localePreference";

function isLocalePreference(value: string | null): value is LocalePreference {
  return (
    value === "system" ||
    (SUPPORTED_LOCALES as readonly string[]).includes(value ?? "")
  );
}

/**
 * 保存済みの言語設定を読む。
 *
 * 未保存・壊れた値・読み出し失敗はすべて "system"（端末設定に追従）に倒す。
 * 言語設定が読めないだけで起動を止める理由が無いため。
 */
export async function loadLocalePreference(): Promise<LocalePreference> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return isLocalePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function saveLocalePreference(pref: LocalePreference): Promise<void> {
  return AsyncStorage.setItem(STORAGE_KEY, pref);
}
