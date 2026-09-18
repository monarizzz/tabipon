import { View, Text, StyleSheet } from "react-native";
import { Camera } from "lucide-react-native";
import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing, radii } from "@/src/style/tokens";

type Props = {
  /** 撮影画面へ向かう導線。渡さなければ見出しと説明だけを出す */
  onPressStart?: () => void;
};

/** スタンプが 0 件のときに出す表示。読み込み失敗時の表示とは別物 */
export function StampGridEmpty({ onPressStart }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Camera size={32} color={colors.secondary} />
      </View>
      <Text style={styles.title}>{t("album.emptyTitle")}</Text>
      <Text style={styles.description}>{t("album.empty")}</Text>
      {onPressStart ? (
        <CommonButton
          label={t("album.emptyAction")}
          onPress={onPressStart}
          variant="accent"
          icon={<Camera size={16} color={colors.primary} />}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.m,
  },
  iconCircle: {
    // 正円にするため、辺は radii.iconCircle の 2 倍で揃える
    width: radii.iconCircle * 2,
    height: radii.iconCircle * 2,
    borderRadius: radii.iconCircle,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.s,
  },
  title: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPrimary,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.m,
  },
});
