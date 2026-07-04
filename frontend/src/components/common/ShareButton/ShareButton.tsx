import { StyleProp, TouchableOpacity, ViewStyle, StyleSheet } from "react-native";
import { Share2 } from "lucide-react-native";
import { colors } from "@/src/theme/tokens";

type Props = {
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function ShareButton({ onPress, size = 44, style }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Share2 size={size * 0.36} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
