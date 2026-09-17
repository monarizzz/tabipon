import React, { useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BottomSheet } from "@/src/commons/sheet/components/BottomSheet/BottomSheet";
import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { formatDateTime } from "@/src/utils/datetime/format";
import { colors, typography, radii, spacing } from "@/src/style/tokens";

type TextFieldProps = {
  mode: "text";
  value: string;
  onChangeValue: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
};

type DateTimeFieldProps = {
  mode: "datetime";
  value: Date;
  onChangeValue: (value: Date) => void;
};

export type EditFieldSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  onSave: () => void;
} & (TextFieldProps | DateTimeFieldProps);

type Props = EditFieldSheetProps;

export function EditFieldSheet({
  visible,
  onClose,
  title,
  onSave,
  ...field
}: Props) {
  const { t, locale } = useTranslation();
  // react-native の TextInput ではなく BottomSheetTextInput の ref 型を使う。
  // 後者は react-native-gesture-handler の TextInput を包んでおり、両者は別の型
  const inputRef =
    useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);
  // Android で開いているダイアログ。null は閉じている状態
  const [androidStep, setAndroidStep] = useState<"date" | "time" | null>(null);

  const handleClose = () => {
    Keyboard.dismiss();
    setAndroidStep(null);
    onClose();
  };

  const handleSave = () => {
    Keyboard.dismiss();
    setAndroidStep(null);
    onSave();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      onOpened={() => {
        if (field.mode === "text") {
          inputRef.current?.focus();
          return;
        }
        // Android は画面内にピッカーを埋め込めないので、開いたらそのまま日付から選ばせる
        if (Platform.OS === "android") {
          setAndroidStep("date");
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
      ) : Platform.OS === "android" ? (
        // Android の DateTimePicker は mode="datetime" に対応しておらず、
        // 画面内に埋め込めない（必ずダイアログで出る）。日付 → 時刻の順に開く
        <>
          <TouchableOpacity
            style={styles.androidValue}
            onPress={() => setAndroidStep("date")}
          >
            <Text style={styles.androidValueText}>
              {formatDateTime(field.value)}
            </Text>
          </TouchableOpacity>
          {androidStep && (
            <DateTimePicker
              value={field.value}
              mode={androidStep}
              onChange={(event, selectedDate) => {
                if (event.type !== "set" || !selectedDate) {
                  setAndroidStep(null);
                  return;
                }
                field.onChangeValue(selectedDate);
                setAndroidStep(androidStep === "date" ? "time" : null);
              }}
            />
          )}
        </>
      ) : (
        <DateTimePicker
          value={field.value}
          mode="datetime"
          // ホイールに日付と時刻を詰めると列が細くなって掴めない。
          // カレンダー＋時刻入力なら、どちらもタップで選べる
          display="inline"
          locale={locale}
          onChange={(_event, selectedDate) => {
            if (selectedDate) {
              field.onChangeValue(selectedDate);
            }
          }}
          style={styles.datePicker}
        />
      )}
      <CommonButton
        label={t("common.save")}
        onPress={handleSave}
        variant="primary"
        style={styles.saveButton}
      />
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
  androidValue: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
  },
  androidValueText: {
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  datePicker: {
    // カレンダーはシートの幅いっぱいに置く。中央寄せだと親の幅からはみ出し、
    // はみ出た部分にタップが届かなくなる
    alignSelf: "stretch",
    marginBottom: spacing.xl,
  },
  saveButton: {
    alignSelf: "stretch",
  },
});
