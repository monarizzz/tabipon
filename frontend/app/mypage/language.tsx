import { Fragment } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { NavBar } from "@/src/components/common/layout/NavBar/NavBar";
import { Card } from "@/src/components/common/Card/Card";
import { ListItem } from "@/src/components/common/ListItem/ListItem";
import { useTranslation } from "@/src/i18n/I18nProvider";
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type LocalePreference,
} from "@/src/i18n";
import { colors, radii, spacing } from "@/src/theme/tokens";

export default function LanguageScreen() {
  const router = useRouter();
  const { t, preference, setPreference } = useTranslation();

  const options: { key: LocalePreference; label: string }[] = [
    { key: "system", label: t("language.system") },
    ...SUPPORTED_LOCALES.map((code) => ({
      key: code,
      label: LOCALE_LABELS[code],
    })),
  ];

  return (
    <View style={styles.container}>
      <NavBar title={t("language.title")} onBack={() => router.back()} />
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
