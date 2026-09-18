import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TriangleAlert } from "lucide-react-native";

import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, radii, spacing } from "@/src/style/tokens";

type Props = {
  /** 失敗した理由。開発者向けの文言なので、翻訳せずそのまま出す */
  detail?: string;
  onRetry: () => void;
};

/** 端末ローカル DB の準備に失敗して、アプリ本体を開けないときに出す画面 */
export function DbErrorScreen({ detail, onRetry }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom },
      ]}
    >
      <TriangleAlert size={40} color={colors.secondary} />
      <Text style={styles.title}>{t("dbError.title")}</Text>
      <Text style={styles.message}>{t("dbError.message")}</Text>
      {detail ? (
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>{t("dbError.detailLabel")}</Text>
          <Text style={styles.detailText}>{detail}</Text>
        </View>
      ) : null}
      <CommonButton
        label={t("common.retry")}
        onPress={onRetry}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.l,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPrimary,
    textAlign: "center",
  },
  message: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textMuted,
    textAlign: "center",
  },
  detail: {
    alignSelf: "stretch",
    gap: spacing.xs,
    padding: spacing.l,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  detailLabel: {
    fontSize: typography.labelBold.fontSize,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textPrimary,
  },
  detailText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    color: colors.textMuted,
  },
});
