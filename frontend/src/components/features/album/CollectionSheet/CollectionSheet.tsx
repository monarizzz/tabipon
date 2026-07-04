import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { BottomSheet } from "@/src/components/common/BottomSheet/BottomSheet";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, radii, spacing } from "@/src/theme/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  name: string;
  onChangeName: (value: string) => void;
  onAdd: () => void;
};

export function CollectionSheet({
  visible,
  onClose,
  name,
  onChangeName,
  onAdd,
}: Props) {
  const { t } = useTranslation();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>{t("collection.add")}</Text>
      <Text style={styles.fieldLabel}>{t("collection.name")}</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={name}
        onChangeText={onChangeName}
        placeholder={t("collection.namePlaceholder")}
        placeholderTextColor={colors.textPlaceholder}
      />
      <View style={styles.buttonWrap}>
        <CommonButton
          label={t("common.add")}
          onPress={onAdd}
          variant="primary"
          disabled={!name.trim()}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.navTitle.fontSize,
    fontWeight: typography.navTitle.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    fontSize: typography.labelBold.fontSize,
    fontWeight: typography.labelBold.fontWeight,
    color: colors.textMuted,
    marginBottom: spacing.s,
  },
  input: {
    height: 52,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.l,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  buttonWrap: {
    alignItems: "stretch",
  },
});
