import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Vibration,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, type Href } from "expo-router";
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
import { useTabBarItems } from "@/src/commons/layout/hooks/useTabBarItems";
import { CommonDialog } from "@/src/commons/sheet/components/CommonDialog/CommonDialog";
import { Stamp } from "@/src/commons/stamp/components/Stamp/Stamp";
import { StampHelp } from "@/src/features/camera/components/StampHelp/StampHelp";
import { DesignChangeSheet } from "@/src/features/camera/components/DesignChangeSheet/DesignChangeSheet";
import { FRAME_STYLE_OPTIONS } from "@/src/features/camera/constants/frameStyleOptions";
import {
  DEFAULT_STAMP_COLOR,
  STAMP_INK_COLORS,
} from "@/src/utils/stamp/constants/constants";
import { StampOrientationGuide } from "@/src/features/camera/components/StampOrientationGuide/StampOrientationGuide";
import { newStampId, saveStamp } from "@/src/infra/db/stamps";
import { generateStampPngFromUri } from "@/src/utils/stamp/io";
import { seedFromStampId } from "@/src/utils/stamp/seed";
import { useStampPressGesture } from "@/src/utils/stampPress/useStampPressGesture";
import type { PressGestureFinish } from "@/src/utils/stampPress/pressGesture";
import { playStampSound } from "@/src/libs/sound";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/style/tokens";

export default function StampPressScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { uri, latitude, longitude, address } = useLocalSearchParams<{
    uri?: string;
    latitude?: string;
    longitude?: string;
    address?: string;
  }>();
  const [helpVisible, setHelpVisible] = React.useState(false);
  const [designSheetVisible, setDesignSheetVisible] = React.useState(false);
  const [pendingTab, setPendingTab] = React.useState<Href | null>(null);
  // 押す前のスタンプを捨てることになるので、遷移前に確認ダイアログを出す
  const tabItems = useTabBarItems(
    React.useCallback((tab) => setPendingTab(tab.href), []),
  );
  // 確定済みのデザイン。スタンプを押したときに生成へ渡すのはこちら
  const [frameStyleId, setFrameStyleId] = React.useState(
    FRAME_STYLE_OPTIONS[0].id,
  );
  const [color, setColor] = React.useState(DEFAULT_STAMP_COLOR);
  // シートで選択中のデザイン。**確定と分けてある。**
  // シートはスワイプや背景タップでも閉じられるので、選択をそのまま確定扱いにすると
  // 「適用」を押さずに閉じたつもりでも生成に使われてしまう
  const [draftFrameStyleId, setDraftFrameStyleId] =
    React.useState(frameStyleId);
  const [draftColor, setDraftColor] = React.useState(color);
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);

  const openDesignSheet = () => {
    setDraftFrameStyleId(frameStyleId);
    setDraftColor(color);
    setDesignSheetVisible(true);
  };
  const [saveFailed, setSaveFailed] = React.useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = React.useState("");
  const [waiting, setWaiting] = React.useState(false);
  const [stampPressed, setStampPressed] = React.useState(false);
  const longPressTriggeredRef = React.useRef(false);
  const stampScale = useSharedValue(1);
  const stampWrapRef = React.useRef<View>(null);
  // 押した瞬間に決まる演出値。長押しで押した場合は 0 のまま（掠れも傾きも無し）
  const finishRef = React.useRef<PressGestureFinish>({
    scratchLevel: 0,
    tiltAngle: 0,
  });

  // 生成と保存をまとめて行い、スタンプ完成画面へ進む。
  //
  // **id を先に払い出す。**掠れ模様の seed は id から導くので（`seed.ts`）、
  // 描く前に確定していないと、あとで色やフレームを変えて再生成したときに
  // 模様が変わってしまう
  const createAndSave = React.useCallback(
    async (stampTop: string) => {
      if (!uri) {
        router.push({ pathname: "/stamp-done", params: { stampTop } });
        return;
      }
      setWaiting(true);
      try {
        const id = newStampId();
        const { scratchLevel, tiltAngle } = finishRef.current;
        const stampPng = await generateStampPngFromUri(uri, {
          color,
          frame: frameStyleId,
          scratchLevel,
          tiltAngle,
          seed: seedFromStampId(id),
        });
        await saveStamp({
          id,
          stampPng,
          photoUri: uri,
          capturedAt: new Date().toISOString(),
          location:
            latitude && longitude
              ? { latitude: Number(latitude), longitude: Number(longitude) }
              : null,
          address: address ?? null,
          color,
          frameId: frameStyleId,
          scratchLevel,
          tiltAngle,
        });
        router.push({
          pathname: "/stamp-done",
          params: { stampTop, stampId: id },
        });
      } catch (error) {
        console.error("[stamp-press] failed to create stamp", error);
        setSaveErrorMessage(
          error instanceof Error ? `${error.name}: ${error.message}` : "",
        );
        setSaveFailed(true);
      } finally {
        setWaiting(false);
      }
    },
    [address, color, frameStyleId, latitude, longitude, router, uri],
  );

  const goToStampDone = React.useCallback(() => {
    // 次の画面(animation: 'none')でも同じ画面座標にスタンプが来るよう、押した位置を引き継ぐ
    stampWrapRef.current?.measureInWindow((_x, y) => {
      void createAndSave(String(Math.round(y)));
    });
  }, [createAndSave]);

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
      withTiming(0.82, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      }),
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
        onBack={() => router.back()}
        rightIcon={<Text style={styles.helpIcon}>？</Text>}
        onRightPress={() => setHelpVisible((visible) => !visible)}
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
              <Stamp imageUri={uri} />
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
      <StampHelp visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <DesignChangeSheet
        visible={designSheetVisible}
        // 「適用」を押さずに閉じた場合は選択を捨てる
        onClose={() => setDesignSheetVisible(false)}
        frameStyles={FRAME_STYLE_OPTIONS}
        selectedFrameStyleId={draftFrameStyleId}
        onSelectFrameStyle={setDraftFrameStyleId}
        colorOptions={STAMP_INK_COLORS}
        selectedColor={draftColor}
        onSelectColor={setDraftColor}
        showLandmarkName={showLandmarkName}
        onToggleShowLandmarkName={setShowLandmarkName}
        // 生成はスタンプを押した時点で走るので、ここでは選択を確定するだけでよい
        onConfirm={() => {
          setFrameStyleId(draftFrameStyleId);
          setColor(draftColor);
          setDesignSheetVisible(false);
        }}
      />
      <CommonDialog
        visible={pendingTab !== null}
        title={t("discardDialog.title")}
        message={t("discardDialog.message")}
        confirmLabel={t("common.discard")}
        onCancel={() => setPendingTab(null)}
        onConfirm={() => {
          if (pendingTab) router.replace(pendingTab);
          setPendingTab(null);
        }}
      />
      <CommonDialog
        visible={saveFailed}
        title={t("stampPress.saveFailedTitle")}
        message={saveErrorMessage}
        confirmLabel={t("common.retry")}
        onCancel={() => setSaveFailed(false)}
        onConfirm={() => {
          setSaveFailed(false);
          goToStampDone();
        }}
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
  debug: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "monospace",
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
  previewLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 999,
  },
});
