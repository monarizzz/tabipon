import React, { useRef } from "react";
import { Keyboard, Text, StyleSheet, TextInput } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BottomSheet } from "@/src/components/common/BottomSheet/BottomSheet";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, radii, spacing } from "@/src/theme/tokens";

type TextFieldProps = {
  mode: "text";
  value: string;
  onChangeValue: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
};

type DateFieldProps = {
  mode: "date";
  value: Date;
  onChangeValue: (value: Date) => void;
};

export type EditFieldSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  onSave: () => void;
} & (TextFieldProps | DateFieldProps);

type Props = EditFieldSheetProps;

export function EditFieldSheet({
  visible,
  onClose,
  title,
  onSave,
  ...field
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    Keyboard.dismiss();
    onSave();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      onOpened={() => {
        if (field.mode === "text") {
          inputRef.current?.focus();
        }
      }}
    >
      <Text style={styles.title}>{title}</Text>
      {field.mode === "text" ? (
        <BottomSheetTextInput
          ref={inputRef}
          style={[styles.input, field.multiline && styles.inputMultiline]}
          value={field.value}
          onChangeText={field.onChangeValue}
          placeholder={field.placeholder}
          placeholderTextColor={colors.textPlaceholder}
          multiline={field.multiline}
          textAlignVertical={field.multiline ? "top" : "center"}
        />
      ) : (
        <DateTimePicker
          value={field.value}
          mode="date"
          display="spinner"
          onChange={(_event, selectedDate) => {
            if (selectedDate) {
              field.onChangeValue(selectedDate);
            }
          }}
          style={styles.datePicker}
        />
      )}
      <CommonButton label={t("common.save")} onPress={handleSave} variant="primary" style={styles.saveButton} />
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
  inputMultiline: {
    height: 120,
    paddingVertical: spacing.l,
  },
  datePicker: {
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  saveButton: {
    alignSelf: "stretch",
  },
});
