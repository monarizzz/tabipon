import { Fragment } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";

import { NavBar } from "@/src/commons/layout/components/NavBar/NavBar";
import { Card } from "@/src/commons/other/components/Card/Card";
import { ListItem } from "@/src/commons/other/components/ListItem/ListItem";
import type { Language } from "@/src/features/mypage/types/language";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, radii, spacing } from "@/src/style/tokens";

type Props = Language;

export function LanguageMain({
  options,
  preference,
  selectPreference,
  back,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <NavBar title={t("language.title")} onBack={back} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          {options.map((option, index) => (
            <Fragment key={option.key}>
              <ListItem
                label={option.label}
                onPress={() => selectPreference(option.key)}
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
