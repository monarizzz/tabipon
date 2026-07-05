import { View, StyleSheet } from "react-native";
import { Camera, BookImage } from "lucide-react-native";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, radii, spacing } from "@/src/theme/tokens";

type Props = {
  onContinueShooting: () => void;
  onGoToAlbum: () => void;
};

export function StampDoneActions({ onContinueShooting, onGoToAlbum }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <CommonButton
          label={t("stampDone.keepShooting")}
          onPress={onContinueShooting}
          variant="secondary"
          icon={<Camera size={16} color={colors.secondary} />}
          style={styles.rowButton}
        />
        <CommonButton
          label={t("stampDone.toAlbum")}
          onPress={onGoToAlbum}
          variant="accent"
          icon={<BookImage size={16} color={colors.primary} />}
          style={styles.rowButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.l,
  },
  row: {
    flexDirection: "row",
    gap: spacing.m,
  },
  rowButton: {
    flex: 1,
    borderRadius: radii.hint,
  },
});
