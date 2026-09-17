import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Vibration,
  ActivityIndicator,
} from "react-native";
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
import { Palette } from "lucide-react-native";

import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { NavBar } from "@/src/commons/layout/components/NavBar/NavBar";
import { TabBar } from "@/src/commons/layout/components/TabBar/TabBar";
import { CommonDialog } from "@/src/commons/sheet/components/CommonDialog/CommonDialog";
import { Stamp } from "@/src/commons/stamp/components/Stamp/Stamp";
import { DesignChangeSheet } from "@/src/features/camera/components/DesignChangeSheet/DesignChangeSheet";
import { StampHelp } from "@/src/features/camera/components/StampHelp/StampHelp";
import { StampOrientationGuide } from "@/src/features/camera/components/StampOrientationGuide/StampOrientationGuide";
import { FRAME_STYLE_OPTIONS } from "@/src/features/camera/constants/frameStyleOptions";
import type { StampPress } from "@/src/features/camera/types/stampPress";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { playStampSound } from "@/src/libs/sound";
import { STAMP_INK_COLORS } from "@/src/utils/stamp/constants/constants";
import type { PressGestureFinish } from "@/src/utils/stampPress/types/pressGesture";
import { useStampPressGesture } from "@/src/utils/stampPress/useStampPressGesture";
import { colors, typography, spacing } from "@/src/style/tokens";

type Props = StampPress;

export function StampPressMain({
  imageUri,
  tabItems,
  color,
  frameStyleId,
  draftColor,
  draftFrameStyleId,
  selectDraftColor,
  selectDraftFrameStyle,
  designSheetVisible,
  openDesignSheet,
  closeDesignSheet,
  confirmDesign,
  showLandmarkName,
  toggleShowLandmarkName,
  helpVisible,
  toggleHelp,
  closeHelp,
  waiting,
  saveFailed,
  saveErrorMessage,
  dismissSaveFailed,
  retrySave,
  discardDialogVisible,
  cancelDiscard,
  confirmDiscard,
  back,
  createStamp,
}: Props) {
  const { t } = useTranslation();
  const [stampPressed, setStampPressed] = React.useState(false);
  const longPressTriggeredRef = React.useRef(false);
  const stampScale = useSharedValue(1);
  const stampWrapRef = React.useRef<View>(null);
  // 押した瞬間に決まる演出値。長押しで押した場合は 0 のまま（掠れも傾きも無し）
  const finishRef = React.useRef<PressGestureFinish>({
    scratchLevel: 0,
    tiltAngle: 0,
  });

  const goToStampDone = React.useCallback(() => {
    // 次の画面(animation: 'none')でも同じ画面座標にスタンプが来るよう、押した位置を引き継ぐ
    stampWrapRef.current?.measureInWindow((_x, y) => {
      createStamp(finishRef.current, y);
    });
  }, [createStamp]);

  // 「ドン」と押し込んで戻る演出。完了したら生成へ進む。
  // 振り下ろしと長押しのどちらで押しても同じ動きにする
  const playPressAnimation = React.useCallback(() => {
    cancelAnimation(stampScale);
    stampScale.set(
      withSequence(
        withTiming(0.74, { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(1.06, { duration: 20, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 120 }, (finished) => {
          if (finished) runOnJS(goToStampDone)();
        }),
      ),
    );
  }, [goToStampDone, stampScale]);

  const { rotationDeg, markPressedByLongPress } = useStampPressGesture({
    onPressed: React.useCallback(
      (finish: PressGestureFinish) => {
        setStampPressed(true);
        // 生成は押し込みアニメーションの完了後（goToStampDone）に走るので、
        // このとき決まった値を持ち回す
        finishRef.current = finish;
        playStampSound();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Vibration.vibrate([0, 40, 30, 80]);
        playPressAnimation();
      },
      [playPressAnimation],
    ),
  });

  const stampAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: stampScale.value },
      { rotate: `${rotationDeg.value}deg` },
    ],
  }));

  // 画面を離れるときに押し込み中の振動を止める
  React.useEffect(() => () => Vibration.cancel(), []);

  const handleStampPressIn = () => {
    longPressTriggeredRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 沈み込みに合わせて端末を振動させる(押し込み中はブーッと鳴らし続ける)
    Vibration.vibrate(500);
    cancelAnimation(stampScale);
    // 長押し判定時間(500ms)にかけてゆっくり沈み込ませる
    stampScale.set(
      withTiming(0.82, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
  };

  const handleStampLongPress = () => {
    // 振り下ろしで既に確定していたら二重に押さない
    if (!markPressedByLongPress()) return;
    longPressTriggeredRef.current = true;
    setStampPressed(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 押し込み中の振動を止めて、「ドン」と強めの二段振動を鳴らす
    Vibration.cancel();
    Vibration.vibrate([0, 40, 30, 80]);
    playPressAnimation();
  };

  const handleStampPressOut = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    // 長押し確定前に離した場合は振動を止めて元の大きさへ戻す
    Vibration.cancel();
    cancelAnimation(stampScale);
    stampScale.set(withSpring(1, { damping: 14, stiffness: 180 }));
  };

  return (
    <View style={styles.container}>
      <NavBar
        title={t("stampPress.title")}
        onBack={back}
        rightIcon={<Text style={styles.helpIcon}>？</Text>}
        onRightPress={toggleHelp}
      />
      <View style={styles.content}>
        <Pressable
          ref={stampWrapRef}
          onPressIn={handleStampPressIn}
          onLongPress={handleStampLongPress}
          onPressOut={handleStampPressOut}
        >
          <Animated.View style={stampAnimatedStyle}>
            {stampPressed ? (
              <Stamp imageUri={imageUri} />
            ) : (
              <StampOrientationGuide color={color} frameId={frameStyleId} />
            )}
          </Animated.View>
        </Pressable>
        <Text style={styles.hint}>{t("stampPress.shakeHint")}</Text>
        <CommonButton
          label={t("design.changeDesign")}
          onPress={openDesignSheet}
          variant="secondary"
          icon={<Palette size={14} color={colors.secondary} />}
        />
      </View>
      <TabBar items={tabItems} />
      <StampHelp visible={helpVisible} onClose={closeHelp} />
      <DesignChangeSheet
        visible={designSheetVisible}
        // 「適用」を押さずに閉じた場合は選択を捨てる
        onClose={closeDesignSheet}
        frameStyles={FRAME_STYLE_OPTIONS}
        selectedFrameStyleId={draftFrameStyleId}
        onSelectFrameStyle={selectDraftFrameStyle}
        colorOptions={STAMP_INK_COLORS}
        selectedColor={draftColor}
        onSelectColor={selectDraftColor}
        showLandmarkName={showLandmarkName}
        onToggleShowLandmarkName={toggleShowLandmarkName}
        onConfirm={confirmDesign}
      />
      <CommonDialog
        visible={discardDialogVisible}
        title={t("discardDialog.title")}
        message={t("discardDialog.message")}
        confirmLabel={t("common.discard")}
        onCancel={cancelDiscard}
        onConfirm={confirmDiscard}
      />
      <CommonDialog
        visible={saveFailed}
        title={t("stampPress.saveFailedTitle")}
        message={saveErrorMessage}
        confirmLabel={t("common.retry")}
        onCancel={dismissSaveFailed}
        onConfirm={retrySave}
      />
      {waiting && (
        <View style={styles.waitingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.waitingText}>{t("stampPress.creating")}</Text>
        </View>
      )}
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
  waitingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.cropDimOverlay,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.l,
  },
  waitingText: {
    fontSize: typography.body.fontSize,
    color: colors.white,
  },
});
