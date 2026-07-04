import { View, TextInput, StyleSheet } from "react-native";
import { Camera, BookImage, Pencil } from "lucide-react-native";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, radii, spacing } from "@/src/theme/tokens";

type Props = {
  spotName: string;
  onChangeSpotName: (spotName: string) => void;
  memo: string;
  onChangeMemo: (memo: string) => void;
  onContinueShooting: () => void;
  onGoToAlbum: () => void;
};

export function StampDoneActions({
  spotName,
  onChangeSpotName,
  memo,
  onChangeMemo,
  onContinueShooting,
  onGoToAlbum,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.spotNameRow}>
        <TextInput
          style={styles.spotNameInput}
          placeholder={t("stampDone.addSpotName")}
          placeholderTextColor={colors.textPlaceholder}
          value={spotName}
          onChangeText={onChangeSpotName}
          textAlign="center"
        />
        <Pencil size={14} color={colors.textMuted} />
      </View>
      <TextInput
        style={styles.memoInput}
        placeholder={t("stampDone.addMemo")}
        placeholderTextColor={colors.textPlaceholder}
        value={memo}
        onChangeText={onChangeMemo}
      />
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
    gap: spacing.l,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  spotNameRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: spacing.s,
  },
  spotNameInput: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPrimary,
    padding: 0,
    minWidth: 160,
  },
  memoInput: {
    borderRadius: radii.hint,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xxl,
    fontSize: typography.buttonLabel.fontSize,
    color: colors.textPrimary,
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
