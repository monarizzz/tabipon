import { View, TextInput, StyleSheet } from "react-native";
import { Camera, BookImage } from "lucide-react-native";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { colors, typography, radii, spacing } from "@/src/theme/tokens";

type Props = {
  memo: string;
  onChangeMemo: (memo: string) => void;
  onContinueShooting: () => void;
  onGoToAlbum: () => void;
};

export function StampDoneActions({
  memo,
  onChangeMemo,
  onContinueShooting,
  onGoToAlbum,
}: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.memoInput}
        placeholder="メモを追加..."
        placeholderTextColor={colors.textPlaceholder}
        value={memo}
        onChangeText={onChangeMemo}
      />
      <View style={styles.row}>
        <CommonButton
          label="続けて撮影"
          onPress={onContinueShooting}
          variant="secondary"
          icon={<Camera size={16} color={colors.secondary} />}
          style={styles.rowButton}
        />
        <CommonButton
          label="アルバムへ"
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
