import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocales } from "expo-localization";
import { i18n, resolveDeviceLocale } from "./index";
import { loadLocalePreference, saveLocalePreference } from "./localePreference";
import type {
  I18nContextValue,
  LocalePreference,
  SupportedLocale,
  TranslateOptions,
  TranslationKey,
} from "./types/i18n";

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>("system");
  // preference が "system" のとき端末設定の変更に追従するための依存値。
  const deviceLocales = useLocales();

  useEffect(() => {
    void loadLocalePreference().then(setPreferenceState);
  }, []);

  const locale = useMemo<SupportedLocale>(() => {
    if (preference !== "system") return preference;
    return resolveDeviceLocale();
    // deviceLocales は端末設定の変更検知用（値は resolveDeviceLocale 内で参照）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference, deviceLocales]);

  const setPreference = useCallback((pref: LocalePreference) => {
    setPreferenceState(pref);
    void saveLocalePreference(pref);
  }, []);

  // i18n はモジュールスコープの共有インスタンスなので locale を代入して使うと
  // 「どのレンダーの locale が残っているか」に翻訳結果が依存する。
  // 呼び出しごとに locale を渡して、インスタンスの状態に触れないようにする
  const t = useCallback(
    (key: TranslationKey, options?: TranslateOptions) =>
      i18n.t(key, { ...options, locale }),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, preference, setPreference, t }),
    [locale, preference, setPreference, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return ctx;
}
