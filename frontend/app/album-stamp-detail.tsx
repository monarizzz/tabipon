import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StampDetailPhoto } from "../src/components/features/album/stamp-rally/StampDetailPhoto";
import { StampInfoCard } from "../src/components/features/album/stamp-rally/StampInfoCard";
import { DesignChangeSheet } from "../src/components/features/camera/DesignChangeSheet";
import { colors, radii, spacing } from "../src/theme/tokens";

export default function StampDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [designSheetVisible, setDesignSheetVisible] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xl }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.iconGlyph}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Text style={styles.iconGlyph}>↗</Text>
        </TouchableOpacity>
      </View>
      <StampDetailPhoto
        spotName="東京スカイツリー"
        onPressDesignChange={() => setDesignSheetVisible(true)}
      />
      <StampInfoCard
        date="2026.06.28"
        location="東京・墨田区"
        memo="晴れた日に行ってきた！展望台からの眺めが最高だった。"
      />
      <DesignChangeSheet
        visible={designSheetVisible}
        onClose={() => setDesignSheetVisible(false)}
        frameStyles={[]}
        selectedFrameStyleId=""
        onSelectFrameStyle={() => {}}
        colorOptions={[]}
        selectedColor=""
        onSelectColor={() => {}}
        showLandmarkName
        onToggleShowLandmarkName={() => {}}
        onConfirm={() => setDesignSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radii.tab,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlyph: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
