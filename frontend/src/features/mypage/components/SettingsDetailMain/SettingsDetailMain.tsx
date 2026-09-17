import { View, StyleSheet } from "react-native";

import { NavBar } from "@/src/commons/layout/components/NavBar/NavBar";
import type { SettingsDetail } from "@/src/features/mypage/types/settingsDetail";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors } from "@/src/style/tokens";

type Props = SettingsDetail;

/** 設定メニューから開く詳細画面。通知・プライバシー・ヘルプで共通 */
export function SettingsDetailMain({ titleKey, back }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <NavBar title={t(titleKey)} onBack={back} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
