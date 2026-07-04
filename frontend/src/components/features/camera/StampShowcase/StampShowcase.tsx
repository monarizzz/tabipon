import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Share2 } from "lucide-react-native";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { colors, spacing } from "@/src/theme/tokens";

type Props = {
  imageUri?: string;
  onShare?: () => void;
};

export function StampShowcase({ imageUri, onShare }: Props) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.shareButton} onPress={onShare} activeOpacity={0.7}>
        <Share2 size={14} color={colors.secondary} />
      </TouchableOpacity>
      <Stamp imageUri={imageUri} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.l,
  },
  shareButton: {
    position: "absolute",
    top: spacing.m,
    right: spacing.xl,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
