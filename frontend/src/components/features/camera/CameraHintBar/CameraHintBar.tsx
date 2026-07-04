import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, radii, spacing } from "@/src/theme/tokens";

type Props = {
  text?: string;
};

export function CameraHintBar({ text }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{text ?? t("camera.hint")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.hint,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  text: {
    fontSize: 11,
    color: colors.textPlaceholder,
  },
});
