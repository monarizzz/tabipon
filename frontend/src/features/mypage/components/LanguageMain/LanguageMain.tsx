import { Fragment } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";

import { NavBar } from "@/src/commons/layout/components/NavBar/NavBar";
import { Card } from "@/src/commons/other/components/Card/Card";
import { ListItem } from "@/src/commons/other/components/ListItem/ListItem";
import { localeOptions } from "@/src/features/mypage/utils/localeOptions";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, radii, spacing } from "@/src/style/tokens";

type Props = {
  onBack: () => void;
};

/**
 * 言語設定。選択中の言語と切り替えは I18nProvider が持つので、
 * この画面が持つ状態は無い
 */
export function LanguageMain({ onBack }: Props) {
  const { t, preference, setPreference } = useTranslation();
  const options = localeOptions(t);

  return (
    <View style={styles.container}>
      <NavBar title={t("language.title")} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          {options.map((option, index) => (
            <Fragment key={option.key}>
              <ListItem
                label={option.label}
                onPress={() => setPreference(option.key)}
                rightElement={
                  preference === option.key ? (
                    <Check size={18} color={colors.primary} />
                  ) : undefined
                }
              />
              {index < options.length - 1 && <View style={styles.separator} />}
            </Fragment>
          ))}
        </Card>
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
  card: {
    padding: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
