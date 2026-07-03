import React from "react";
import { View, StyleSheet } from "react-native";
import { CameraView, type CameraType, type FlashMode } from "expo-camera";
import { colors } from "@/src/theme/tokens";

type Props = {
  facing: CameraType;
  flash: FlashMode;
  guideSize?: number;
};

export const CameraPreview = React.forwardRef<CameraView, Props>(
  ({ facing, flash, guideSize = 296 }, ref) => {
    return (
      <View style={styles.wrap}>
        <CameraView ref={ref} style={styles.camera} facing={facing} flash={flash} />
        <View
          pointerEvents="none"
          style={[
            styles.guide,
            { width: guideSize, height: guideSize, borderRadius: guideSize / 2 },
          ]}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  guide: {
    borderWidth: 2,
    borderColor: colors.white,
  },
});
