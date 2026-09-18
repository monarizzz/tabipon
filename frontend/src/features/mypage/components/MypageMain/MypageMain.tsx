import { View, ScrollView, StyleSheet } from "react-native";
import { Bell, Shield, Info, Settings, Languages } from "lucide-react-native";

import { NavBar } from "@/src/commons/layout/components/NavBar/NavBar";
import { SettingsMenuSection } from "@/src/features/mypage/components/SettingsMenuSection/SettingsMenuSection";
import type { Mypage, MypageMenuId } from "@/src/features/mypage/types/mypage";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, spacing } from "@/src/style/tokens";

/** 設定メニューの並びとアイコン。文言は翻訳キーから引く */
const MENU_ITEMS: {
  id: MypageMenuId;
  labelKey: `mypage.${MypageMenuId}`;
  icon: typeof Bell;
}[] = [
  { id: "notifications", labelKey: "mypage.notifications", icon: Bell },
  { id: "privacy", labelKey: "mypage.privacy", icon: Shield },
  { id: "language", labelKey: "mypage.language", icon: Languages },
  { id: "help", labelKey: "mypage.help", icon: Info },
];

type Props = Mypage;

export function MypageMain({ pressMenu }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <NavBar
        title={t("mypage.title")}
        rightIcon={<Settings size={16} color={colors.textMuted} />}
        onRightPress={() => {}}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsMenuSection
          items={MENU_ITEMS.map((item) => ({
            id: item.id,
            label: t(item.labelKey),
            icon: item.icon,
            onPress: () => pressMenu(item.id),
          }))}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
});
