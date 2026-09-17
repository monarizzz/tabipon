import { View, StyleSheet } from "react-native";

import { NavBar } from "@/src/commons/layout/components/NavBar/NavBar";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import type { TranslationKey } from "@/src/libs/i18n/types/i18n";
import { colors } from "@/src/style/tokens";

type Props = {
  /** 見出しの翻訳キー。文言の解決はこの中で行う */
  titleKey: TranslationKey;
  onBack: () => void;
};

/**
 * 設定メニューから開く詳細画面の枠。
 *
 * 通知・プライバシー・ヘルプの 3 画面は、まだ見出しを出すだけで中身が無い。
 * 同じ JSX を 3 枚に書き写さず、見出しだけを差し替える形にしてある。
 */
export function SettingsDetailMain({ titleKey, onBack }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <NavBar title={t(titleKey)} onBack={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
