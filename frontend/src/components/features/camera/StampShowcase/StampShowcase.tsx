import { View, StyleSheet } from "react-native";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { ShareButton } from "@/src/components/common/ShareButton/ShareButton";
import { spacing } from "@/src/theme/tokens";

type Props = {
  imageUri?: string;
  onShare?: () => void;
};

export function StampShowcase({ imageUri, onShare }: Props) {
  return (
    <View style={styles.wrap}>
      <ShareButton onPress={onShare} size={44} style={styles.shareButton} />
      <Stamp imageUri={imageUri} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.m,
  },
  shareButton: {
    position: "absolute",
    top: spacing.m,
    right: spacing.xl,
    zIndex: 1,
  },
});
