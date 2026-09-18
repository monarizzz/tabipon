import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/src/style/tokens";

type Props = {
  /** 出す文言。`null` の間は何も描かない */
  message: string | null;
};

const FADE_DURATION = 200;

/**
 * 画面下部に数秒出して消える短い知らせ。
 *
 * **消すタイミングは持たない。**`message` を `null` に戻すのは呼び出し側で、
 * このコンポーネントは受け取った値をフェードさせるだけにする。操作の結果として
 * 出すものなので、何秒で消すかは知らせる側が決められた方がよい
 */
export function Toast({ message }: Props) {
  const [opacity] = React.useState(() => new Animated.Value(0));
  // フェードアウトの間も文字を出しておくため、消えるまで直前の文言を保持する
  const [shown, setShown] = React.useState<string | null>(message);
  if (message !== null && message !== shown) {
    setShown(message);
  }

  React.useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: message !== null ? 1 : 0,
      duration: FADE_DURATION,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && message === null) {
        setShown(null);
      }
    });
    return () => animation.stop();
  }, [message, opacity]);

  if (shown === null) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, { opacity }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.toast}>
        <Text style={styles.label}>{shown}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: spacing.xxxl,
    alignItems: "center",
  },
  toast: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xl,
  },
  label: {
    ...typography.buttonLabel,
    color: colors.textPrimary,
  },
});
