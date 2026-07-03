import { View, Text, StyleSheet } from "react-native";
import { Modal } from "@/src/components/common/Modal/Modal";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CommonDialog({
  visible,
  title,
  message,
  cancelLabel = "キャンセル",
  confirmLabel,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} onClose={onCancel}>
      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.buttonRow}>
        <CommonButton
          label={cancelLabel}
          onPress={onCancel}
          variant="ghost"
          style={styles.flexButton}
        />
        <CommonButton
          label={confirmLabel}
          onPress={onConfirm}
          variant="primary"
          style={styles.flexButton}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  textGroup: {
    gap: spacing.s,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.navTitle.fontSize,
    fontWeight: typography.navTitle.fontWeight,
    color: colors.textPrimary,
  },
  message: {
    fontSize: typography.buttonLabel.fontSize,
    color: colors.textMuted,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.m,
  },
  flexButton: {
    flex: 1,
    paddingHorizontal: 0,
  },
});
