import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Zap, ZapOff, SwitchCamera } from "lucide-react-native";
import { colors, radii, spacing } from "@/src/theme/tokens";

type Props = {
  flashOn: boolean;
  onToggleFlash: () => void;
  onCapture: () => void;
  onFlipCamera: () => void;
  disabled?: boolean;
};

export function CameraControls({
  flashOn,
  onToggleFlash,
  onCapture,
  onFlipCamera,
  disabled = false,
}: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onToggleFlash}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {flashOn ? (
          <Zap size={20} color={colors.secondary} />
        ) : (
          <ZapOff size={20} color={colors.secondary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.shutter, disabled && styles.shutterDisabled]}
        onPress={onCapture}
        disabled={disabled}
        activeOpacity={0.8}
      />

      <TouchableOpacity
        style={styles.iconButton}
        onPress={onFlipCamera}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <SwitchCamera size={20} color={colors.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
    paddingVertical: spacing.l,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: radii.circle,
    backgroundColor: colors.primary,
  },
  shutterDisabled: {
    opacity: 0.4,
  },
});
