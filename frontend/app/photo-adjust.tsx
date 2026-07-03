import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { NavBar } from "@/src/components/common/layout/NavBar/NavBar";
import { PhotoCropArea } from "@/src/components/features/camera/PhotoCropArea/PhotoCropArea";
import { PhotoAdjustControls } from "@/src/components/features/camera/PhotoAdjustControls/PhotoAdjustControls";
import { colors } from "@/src/theme/tokens";

export default function PhotoAdjustScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [zoom, setZoom] = React.useState(0.5);

  return (
    <View style={styles.container}>
      <NavBar title="写真を調整" onBack={() => router.back()} />
      <PhotoCropArea imageUri={uri} />
      <PhotoAdjustControls
        zoom={zoom}
        onChangeZoom={setZoom}
        onConfirm={() => router.push("/stamp-press")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
