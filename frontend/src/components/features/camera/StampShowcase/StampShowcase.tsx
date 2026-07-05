import { View, StyleSheet } from "react-native";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { ShareButton } from "@/src/components/common/ShareButton/ShareButton";
import { SpotNameLabel } from "@/src/components/common/SpotNameLabel/SpotNameLabel";
import { spacing } from "@/src/theme/tokens";

type Props = {
  imageUri?: string;
  onShare?: () => void;
  spotName?: string;
  onPressSpotName?: () => void;
};

export function StampShowcase({
  imageUri,
  onShare,
  spotName,
  onPressSpotName,
}: Props) {
  return (
    <View style={styles.wrap}>
      <ShareButton onPress={onShare} size={44} style={styles.shareButton} />
      <Stamp imageUri={imageUri} />
      {spotName !== undefined && (
        <SpotNameLabel spotName={spotName} onPress={onPressSpotName} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.m,
    paddingVertical: spacing.m,
  },
  shareButton: {
    position: "absolute",
    top: spacing.m,
    right: spacing.xl,
    zIndex: 1,
  },
});
