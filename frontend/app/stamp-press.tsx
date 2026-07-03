import React from "react";
import { View, Text, Pressable, StyleSheet, Vibration } from "react-native";
import { useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  cancelAnimation,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Camera, Image, Palette, User } from "lucide-react-native";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { NavBar } from "@/src/components/common/layout/NavBar/NavBar";
import { TabBar } from "@/src/components/common/layout/TabBar/TabBar";
import { CommonDialog } from "@/src/components/common/CommonDialog/CommonDialog";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { StampHelp } from "@/src/components/features/camera/StampHelp/StampHelp";
import { DesignChangeSheet } from "@/src/components/features/camera/DesignChangeSheet/DesignChangeSheet";
import {
  FRAME_STYLE_OPTIONS,
  STAMP_COLOR_OPTIONS,
} from "@/src/components/features/camera/DesignChangeSheet/frameStyleOptions";
import { colors, typography, spacing } from "@/src/theme/tokens";

export default function StampPressScreen() {
  const router = useRouter();
  const [helpVisible, setHelpVisible] = React.useState(false);
  const [designSheetVisible, setDesignSheetVisible] = React.useState(false);
  const [pendingTab, setPendingTab] = React.useState<Href | null>(null);
  const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
    FRAME_STYLE_OPTIONS[0].id,
  );
  const [selectedColor, setSelectedColor] = React.useState(STAMP_COLOR_OPTIONS[0]);
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);
  const longPressTriggeredRef = React.useRef(false);
  const stampScale = useSharedValue(1);

  const stampAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stampScale.value }],
  }));

  const goToStampDone = React.useCallback(() => {
    router.push("/stamp-done");
  }, [router]);

  const handleStampPressIn = () => {
    longPressTriggeredRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cancelAnimation(stampScale);
    // 長押し判定時間(500ms)にかけてゆっくり沈み込ませる
    stampScale.value = withTiming(0.82, {
      duration: 500,
      easing: Easing.out(Easing.quad),
    });
  };

  const handleStampLongPress = () => {
    longPressTriggeredRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 押し込み切った「ドン」という感触を出してから遷移する
    cancelAnimation(stampScale);
    stampScale.value = withSequence(
      withTiming(0.74, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1.06, { duration: 150, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 120 }, (finished) => {
        if (finished) runOnJS(goToStampDone)();
      }),
    );
  };

  const handleStampPressOut = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    // 長押し確定前に離した場合は元の大きさへ戻す
    cancelAnimation(stampScale);
    stampScale.value = withSpring(1, { damping: 14, stiffness: 180 });
  };

  return (
    <View style={styles.container}>
      <NavBar
        title="スタンプを押す"
        onBack={() => router.back()}
        rightIcon={<Text style={styles.helpIcon}>？</Text>}
        onRightPress={() => setHelpVisible((visible) => !visible)}
      />
      <View style={styles.content}>
        <Pressable
          onPressIn={handleStampPressIn}
          onLongPress={handleStampLongPress}
          onPressOut={handleStampPressOut}
        >
          <Animated.View style={stampAnimatedStyle}>
            <Stamp />
          </Animated.View>
        </Pressable>
        <Text style={styles.hint}>スマホを上下に振ってスタンプ！</Text>
        <CommonButton
          label="デザインを変更する"
          onPress={() => setDesignSheetVisible(true)}
          variant="secondary"
          icon={<Palette size={14} color={colors.secondary} />}
        />
      </View>
      <TabBar
        items={[
          {
            key: "index",
            label: "カメラ",
            icon: Camera,
            active: true,
            onPress: () => setPendingTab("/(tabs)"),
          },
          {
            key: "album",
            label: "アルバム",
            icon: Image,
            active: false,
            onPress: () => setPendingTab("/(tabs)/album"),
          },
          {
            key: "mypage",
            label: "マイページ",
            icon: User,
            active: false,
            onPress: () => setPendingTab("/(tabs)/mypage"),
          },
        ]}
      />
      <StampHelp visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <DesignChangeSheet
        visible={designSheetVisible}
        onClose={() => setDesignSheetVisible(false)}
        frameStyles={FRAME_STYLE_OPTIONS}
        selectedFrameStyleId={selectedFrameStyleId}
        onSelectFrameStyle={setSelectedFrameStyleId}
        colorOptions={STAMP_COLOR_OPTIONS}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        showLandmarkName={showLandmarkName}
        onToggleShowLandmarkName={setShowLandmarkName}
        onConfirm={() => setDesignSheetVisible(false)}
      />
      <CommonDialog
        visible={pendingTab !== null}
        title="編集内容を破棄しますか？"
        message="タブを切り替えると、現在の編集内容が失われます。"
        confirmLabel="破棄する"
        onCancel={() => setPendingTab(null)}
        onConfirm={() => {
          if (pendingTab) router.replace(pendingTab);
          setPendingTab(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
  },
  hint: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  helpIcon: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
