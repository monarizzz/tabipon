import { useRef } from "react";
import { Animated, TouchableOpacity, View, StyleSheet } from "react-native";
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
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const shutterScale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });
  const ringScale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.15],
  });
  const ringOpacity = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

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

      <View style={styles.shutterWrapper}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <TouchableOpacity
          onPress={onCapture}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.shutter,
              disabled && styles.shutterDisabled,
              { transform: [{ scale: shutterScale }] },
            ]}
          />
        </TouchableOpacity>
      </View>

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
  shutterWrapper: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.35)",
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
