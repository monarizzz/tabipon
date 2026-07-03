import React from "react";
import { View, StyleSheet } from "react-native";
import { CameraView, type CameraType, type FlashMode } from "expo-camera";
import { colors } from "@/src/theme/tokens";

type Props = {
  facing: CameraType;
  flash: FlashMode;
  size?: number;
};

export const CameraPreview = React.forwardRef<CameraView, Props>(
  ({ facing, flash, size = 296 }, ref) => {
    return (
      <View style={styles.wrap}>
        <CameraView
          ref={ref}
          style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
          facing={facing}
          flash={flash}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    borderWidth: 2,
    borderColor: colors.white,
    overflow: "hidden",
  },
});
