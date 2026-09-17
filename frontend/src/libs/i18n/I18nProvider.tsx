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
  // null は「保存済みの設定をまだ読めていない」。初期値を "system" に
  // しないのは、読み終わる前に端末の言語で 1 フレーム描いてしまわないため
  const [preference, setPreferenceState] = useState<LocalePreference | null>(
    null,
  );
  // preference が "system" のとき端末設定の変更に追従するための依存値。
  const deviceLocales = useLocales();

  useEffect(() => {
    void loadLocalePreference().then(setPreferenceState);
  }, []);

  const locale = useMemo<SupportedLocale>(() => {
    if (preference !== null && preference !== "system") return preference;
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
    () => ({ locale, preference: preference ?? "system", setPreference, t }),
    [locale, preference, setPreference, t],
  );

  // 読み終わるまで子を描かない。SQLiteProvider がマイグレーション中に
  // 子を描かないのと同じ扱いで、待つのは AsyncStorage の 1 キー分
  if (preference === null) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return ctx;
}
