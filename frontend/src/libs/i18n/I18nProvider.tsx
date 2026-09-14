import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocales } from "expo-localization";
import { i18n, resolveDeviceLocale } from "./index";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./constants/locales";
import type {
  I18nContextValue,
  LocalePreference,
  SupportedLocale,
  TranslateOptions,
  TranslationKey,
} from "./types/i18n";

const STORAGE_KEY = "app.localePreference";

const I18nContext = createContext<I18nContextValue | null>(null);

function isPreference(value: string | null): value is LocalePreference {
  return (
    value === "system" ||
    (SUPPORTED_LOCALES as readonly string[]).includes(value ?? "")
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>("system");
  // preference が "system" のとき端末設定の変更に追従するための依存値。
  const deviceLocales = useLocales();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (isPreference(stored)) setPreferenceState(stored);
    });
  }, []);

  const locale = useMemo<SupportedLocale>(() => {
    if (preference !== "system") return preference;
    return resolveDeviceLocale();
    // deviceLocales は端末設定の変更検知用（値は resolveDeviceLocale 内で参照）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference, deviceLocales]);

  i18n.locale = locale ?? DEFAULT_LOCALE;

  const setPreference = useCallback((pref: LocalePreference) => {
    setPreferenceState(pref);
    void AsyncStorage.setItem(STORAGE_KEY, pref);
  }, []);

  const t = useCallback(
    (key: TranslationKey, options?: TranslateOptions) => {
      i18n.locale = locale;
      return i18n.t(key, options);
    },
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
