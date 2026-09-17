import { View, Text, StyleSheet } from "react-native";
import { CameraOff } from "lucide-react-native";

import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing, radii } from "@/src/style/tokens";

type Props = {
  /**
   * アプリから権限ダイアログをもう一度出せるか。
   * 一度拒否されると OS はダイアログを出さなくなるので、
   * false のときは設定アプリへ送るしか復帰の経路が無い
   */
  canAskAgain: boolean;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
};

/** カメラの権限が無いときに、いま何が起きていて何をすれば直るかを出す */
export function CameraPermissionNotice({
  canAskAgain,
  onRequestPermission,
  onOpenSettings,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <CameraOff size={32} color={colors.secondary} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>
          {canAskAgain
            ? t("camera.accessRequiredTitle")
            : t("camera.accessDeniedTitle")}
        </Text>
        <Text style={styles.description}>
          {canAskAgain
            ? t("camera.accessRequiredDescription")
            : t("camera.accessDeniedDescription")}
        </Text>
      </View>
      {canAskAgain ? (
        <CommonButton
          label={t("camera.accessAllow")}
          onPress={onRequestPermission}
        />
      ) : (
        <CommonButton
          label={t("camera.accessOpenSettings")}
          onPress={onOpenSettings}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.circle,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    gap: spacing.m,
  },
  title: {
    fontSize: typography.screenTitle.fontSize,
    fontWeight: typography.screenTitle.fontWeight,
    color: colors.textPrimary,
    textAlign: "center",
  },
  description: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textMuted,
    textAlign: "center",
  },
});
